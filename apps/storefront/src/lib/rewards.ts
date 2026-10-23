import "server-only";
import crypto from "node:crypto";
import { createClient } from "next-sanity";
import { REFERRAL_DISCOUNT, REFERRAL_MIN_ORDER } from "@/lib/checkout/coupons";

// Personal coupons (review thank-yous, referral rewards) and referral codes
// (H16, H17). Coupons are ordinary "coupon" documents with singleUse and
// forCustomer set, so lib/checkout/coupons.ts validates them like any other.

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const writeClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;

// No 0/O or 1/I/L, so codes read cleanly off a phone screen.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const randomCode = (length: number) => Array.from(crypto.randomBytes(length), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
const DAY = 24 * 60 * 60 * 1000;

async function unusedCode(prefix: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${prefix}${randomCode(6)}`;
    const taken = await writeClient?.fetch<boolean>(`count(*[(_type == "coupon" && code == $code) || (_type == "customer" && referralCode == $code)]) > 0`, { code });
    if (!taken) return code;
  }
  throw new Error("Could not find an unused coupon code.");
}

/** Creates a one-time personal coupon and returns its code. */
export async function issuePersonalCoupon(input: {
  prefix: string;
  kind: "review-thanks" | "referral-reward";
  discountType: "percent" | "flat";
  discountValue: number;
  minOrderAmount: number;
  validDays: number;
  forCustomer?: string;
}): Promise<string> {
  if (!writeClient) throw new Error("SANITY_API_TOKEN is not configured.");
  const code = await unusedCode(input.prefix);
  await writeClient.create({
    _type: "coupon",
    code,
    kind: input.kind,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minOrderAmount: input.minOrderAmount,
    active: true,
    singleUse: true,
    ...(input.forCustomer && { forCustomer: input.forCustomer }),
    expiresAt: new Date(Date.now() + input.validDays * DAY).toISOString(),
  });
  return code;
}

/** The customer's referral code, created the first time it's asked for. */
export async function ensureReferralCode(customerId: string): Promise<string | null> {
  if (!writeClient) return null;
  const existing = await writeClient.fetch<string | null>(`*[_id == $id][0].referralCode`, { id: customerId });
  if (existing) return existing;
  const code = await unusedCode("FRIEND");
  const saved = await writeClient.patch(customerId).setIfMissing({ referralCode: code }).commit<{ referralCode: string }>();
  return saved.referralCode;
}

/** After an order is saved: use up a single-use code, and remember who referred the buyer. */
export async function recordCouponUse(orderDocId: string) {
  if (!writeClient) return;
  const order = await writeClient.fetch<{ orderNumber: string; couponCode?: string; customer?: { _ref: string } } | null>(
    `*[_id == $id][0]{orderNumber, couponCode, customer}`,
    { id: orderDocId },
  );
  const code = order?.couponCode?.trim().toUpperCase();
  if (!order || !code) return;
  const coupon = await writeClient.fetch<{ _id: string; singleUse?: boolean } | null>(`*[_type == "coupon" && code == $code][0]{_id, singleUse}`, { code });
  if (coupon?.singleUse) {
    await writeClient.patch(coupon._id).setIfMissing({ redeemedOrderNumber: order.orderNumber, redeemedAt: new Date().toISOString() }).commit();
    return;
  }
  const referrerId = await writeClient.fetch<string | null>(`*[_type == "customer" && referralCode == $code][0]._id`, { code });
  if (referrerId && referrerId !== order.customer?._ref) {
    await writeClient.patch(orderDocId).setIfMissing({ referredBy: { _type: "reference", _ref: referrerId, _weak: true } }).commit();
  }
}

/** Gives referrers their Rs 100 coupon once the friend's order is delivered (daily cron). */
export async function issueReferralRewards(limit = 50): Promise<number> {
  if (!writeClient) return 0;
  const orders = await writeClient.fetch<{ _id: string; referrer: string }[]>(
    `*[_type == "order" && fulfillmentStatus == "Delivered" && defined(referredBy) && !defined(referralRewardCode)][0...$limit]{_id, "referrer": referredBy._ref}`,
    { limit },
  );
  for (const order of orders) {
    const code = await issuePersonalCoupon({ prefix: "THANKS", kind: "referral-reward", discountType: "flat", discountValue: REFERRAL_DISCOUNT, minOrderAmount: REFERRAL_MIN_ORDER, validDays: 90, forCustomer: order.referrer });
    await writeClient.patch(order._id).setIfMissing({ referralRewardCode: code }).commit();
  }
  return orders.length;
}

export interface RewardCoupon {
  code: string;
  label: string;
  minOrderAmount?: number;
  expiresAt?: string;
}

/** Unused, unexpired personal coupons for the account page. */
export async function getCustomerRewards(customerId: string): Promise<RewardCoupon[]> {
  if (!writeClient) return [];
  const coupons = await writeClient.fetch<{ code: string; kind?: string; discountType: string; discountValue: number; minOrderAmount?: number; expiresAt?: string }[]>(
    `*[_type == "coupon" && forCustomer == $id && active == true && !defined(redeemedOrderNumber) && (!defined(expiresAt) || expiresAt > now())] | order(expiresAt asc){code, kind, discountType, discountValue, minOrderAmount, expiresAt}`,
    { id: customerId },
  );
  return coupons.map((coupon) => ({
    code: coupon.code,
    label: `${coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}${coupon.kind === "referral-reward" ? " · thanks for referring a friend" : coupon.kind === "review-thanks" ? " · thanks for your order" : ""}`,
    minOrderAmount: coupon.minOrderAmount,
    expiresAt: coupon.expiresAt,
  }));
}
