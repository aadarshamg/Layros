import "server-only";
import { sanityClient, SANITY_FETCH_OPTIONS } from "@/lib/sanity";
import {
  CATEGORY_COUPON_OFFERS,
  COUPON_CATEGORY_LABELS,
  getCouponOfferCategory,
  type CouponOfferCategory,
} from "@/lib/promotions";

export interface CouponRule {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrderAmount?: number;
  eligibleCategories?: CouponOfferCategory[];
}

export interface CouponLineItem {
  title: string;
  category?: string;
  quantity: number;
  unitPrice: number;
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: CouponRule;
}

interface RawCoupon {
  code: string;
  discountType?: "percent" | "flat" | null;
  discountValue?: number | null;
  minOrderAmount?: number | null;
  active?: boolean | null;
  expiresAt?: string | null;
  singleUse?: boolean | null;
  forCustomer?: string | null;
  redeemedOrderNumber?: string | null;
}

/** Who is checking out, for personal and referral codes. */
export interface CouponContext {
  /** Session customer id (`customer-<phone>`), never a client-sent value. */
  customerId?: string;
}

/** Referral codes (H17): Rs 100 off a friend's first order of Rs 699+. */
export const REFERRAL_DISCOUNT = 100;
export const REFERRAL_MIN_ORDER = 699;

const BUILT_IN_CATEGORY_COUPONS = Object.values(CATEGORY_COUPON_OFFERS)
  .flat()
  .reduce<Record<string, CouponRule>>((coupons, offer) => {
    coupons[offer.code] = {
      code: offer.code,
      discountType: "percent",
      discountValue: offer.percent,
      minOrderAmount: offer.minimum,
      eligibleCategories: [offer.category],
    };
    return coupons;
  }, {});

function eligibleSubtotal(coupon: CouponRule, subtotal: number, items: CouponLineItem[]) {
  if (!coupon.eligibleCategories?.length) return subtotal;
  return items.reduce((sum, item) => {
    const category = getCouponOfferCategory(item.category, item.title);
    return category && coupon.eligibleCategories?.includes(category)
      ? sum + item.unitPrice * item.quantity
      : sum;
  }, 0);
}

/** Looks up a coupon by code and checks it's active, not expired, and the order meets its minimum — never trusts a discount the client claims. */
export async function validateCoupon(rawCode: string, subtotal: number, items: CouponLineItem[] = [], context: CouponContext = {}): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, message: "Enter a coupon code." };

  const builtInCoupon = BUILT_IN_CATEGORY_COUPONS[code];
  if (builtInCoupon) {
    const qualifyingSubtotal = eligibleSubtotal(builtInCoupon, subtotal, items);
    const category = builtInCoupon.eligibleCategories?.[0];
    const categoryLabel = category ? COUPON_CATEGORY_LABELS[category] : "eligible products";
    if (qualifyingSubtotal <= 0) {
      return { valid: false, message: `${code} is valid only on ${categoryLabel}.` };
    }
    if (builtInCoupon.minOrderAmount && qualifyingSubtotal < builtInCoupon.minOrderAmount) {
      return {
        valid: false,
        message: `Add ₹${builtInCoupon.minOrderAmount - qualifyingSubtotal} more in ${categoryLabel} to use ${code}.`,
      };
    }
    return { valid: true, message: "Coupon applied.", coupon: builtInCoupon };
  }

  // No CDN cache here: single-use codes must be seen as used straight away.
  const coupon = await sanityClient.fetch<RawCoupon | null>(
    `*[_type == "coupon" && code == $code][0]{ code, discountType, discountValue, minOrderAmount, active, expiresAt, singleUse, forCustomer, redeemedOrderNumber }`,
    { code },
    { cache: "no-store" },
  );

  if (!coupon) return validateReferralCode(code, subtotal, context);
  if (!coupon.active) {
    return { valid: false, message: "That coupon code isn't valid." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: "That coupon has expired." };
  }
  if (coupon.singleUse && coupon.redeemedOrderNumber) {
    return { valid: false, message: "That code has already been used." };
  }
  if (coupon.forCustomer && coupon.forCustomer !== context.customerId) {
    return { valid: false, message: context.customerId ? "That code belongs to another account." : "Log in with the phone number this code was sent to." };
  }
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return { valid: false, message: `Add ₹${coupon.minOrderAmount - subtotal} more to use this code.` };
  }

  return {
    valid: true,
    message: "Coupon applied.",
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType ?? "flat",
      discountValue: coupon.discountValue ?? 0,
      minOrderAmount: coupon.minOrderAmount ?? undefined,
    },
  };
}

/** A friend's referral code: Rs 100 off a first order of Rs 699+, logged in, not their own. */
async function validateReferralCode(code: string, subtotal: number, context: CouponContext): Promise<CouponValidationResult> {
  const referrerId = await sanityClient.fetch<string | null>(`*[_type == "customer" && referralCode == $code][0]._id`, { code }, { cache: "no-store" });
  if (!referrerId) return { valid: false, message: "That coupon code isn't valid." };
  if (!context.customerId) return { valid: false, message: "Log in to use a friend's referral code." };
  if (context.customerId === referrerId) return { valid: false, message: "Share your code with friends; it can't be used on your own order." };
  const previousOrders = await sanityClient.fetch<number>(
    `count(*[_type == "order" && customer._ref == $customerId && paymentStatus != "failed"])`,
    { customerId: context.customerId },
    { cache: "no-store" },
  );
  if (previousOrders > 0) return { valid: false, message: "Referral codes are for a first order only." };
  if (subtotal < REFERRAL_MIN_ORDER) return { valid: false, message: `Add ₹${REFERRAL_MIN_ORDER - subtotal} more to use this referral code.` };
  return { valid: true, message: `Referral applied: ₹${REFERRAL_DISCOUNT} off your first order.`, coupon: { code, discountType: "flat", discountValue: REFERRAL_DISCOUNT, minOrderAmount: REFERRAL_MIN_ORDER } };
}

export function calculateDiscount(coupon: CouponRule, subtotal: number, items: CouponLineItem[] = []): number {
  const qualifyingSubtotal = eligibleSubtotal(coupon, subtotal, items);
  const raw = coupon.discountType === "percent" ? (qualifyingSubtotal * coupon.discountValue) / 100 : coupon.discountValue;
  return Math.min(Math.round(raw), qualifyingSubtotal);
}
