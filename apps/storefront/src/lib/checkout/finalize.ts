import "server-only";
import { createClient } from "next-sanity";
import { priceItems, type IncomingItem } from "@/lib/checkout/pricing";
import { validateCoupon, calculateDiscount } from "@/lib/checkout/coupons";
import { saveOrder } from "@/lib/checkout/orders";
import { patchDefaultAddress } from "@/lib/auth/customers";
import { calculateBuyTwoGetOne } from "@/lib/promotions";
import { shippingFeeFor } from "@/lib/shipping";
import type { CheckoutDetailsFormData } from "@leyros/types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const writeClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;

const safeId = (razorpayOrderId: string) => razorpayOrderId.replace(/[^A-Za-z0-9_-]/g, "");

/** Same number whichever path (browser or webhook) records the order first. */
export const razorpayOrderNumber = (razorpayOrderId: string) => `LEY-${safeId(razorpayOrderId).replace(/^order_/, "").toUpperCase()}`;
const orderDocId = (razorpayOrderId: string) => `order-${safeId(razorpayOrderId)}`;
const sessionDocId = (razorpayOrderId: string) => `checkoutSession-${safeId(razorpayOrderId)}`;

export interface CheckoutSession {
  items: IncomingItem[];
  details: CheckoutDetailsFormData;
  couponCode?: string;
  customerId?: string;
}

/**
 * Saved when a Razorpay payment starts, so the webhook can still create the
 * order if the shopper closes the page before the browser confirms payment.
 */
export async function saveCheckoutSession(razorpayOrderId: string, session: CheckoutSession) {
  if (!writeClient) return;
  try {
    await writeClient.createOrReplace({
      _id: sessionDocId(razorpayOrderId),
      _type: "checkoutSession",
      razorpayOrderId,
      createdAt: new Date().toISOString(),
      payload: JSON.stringify(session),
    });
  } catch (error) {
    console.error("saveCheckoutSession failed:", razorpayOrderId, error);
  }
}

export async function getCheckoutSession(razorpayOrderId: string): Promise<CheckoutSession | null> {
  if (!writeClient) return null;
  const doc = await writeClient.fetch<{ payload?: string } | null>(`*[_id == $id][0]{payload}`, { id: sessionDocId(razorpayOrderId) });
  try {
    return doc?.payload ? (JSON.parse(doc.payload) as CheckoutSession) : null;
  } catch {
    return null;
  }
}

export async function findRecordedOrderNumber(razorpayOrderId: string): Promise<string | null> {
  if (!writeClient) return null;
  return writeClient.fetch<string | null>(`*[_id == $id][0].orderNumber`, { id: orderDocId(razorpayOrderId) });
}

/** Re-prices the cart from the catalog and saves the paid order exactly once. */
export async function finalizeRazorpayOrder(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  session: CheckoutSession;
  confirmedBy: "browser" | "webhook";
}): Promise<{ orderNumber: string; saved: boolean }> {
  const orderNumber = razorpayOrderNumber(input.razorpayOrderId);
  const { items, details, couponCode, customerId } = input.session;

  const { items: pricedItems, amountInr } = await priceItems(items);
  let discountAmount = 0;
  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, amountInr, pricedItems);
    if (couponResult.valid && couponResult.coupon) discountAmount = calculateDiscount(couponResult.coupon, amountInr, pricedItems);
  }
  const offerDiscount = calculateBuyTwoGetOne(pricedItems).discountAmount;
  const shippingFee = shippingFeeFor(amountInr);

  const saved = await saveOrder({
    orderNumber,
    documentId: orderDocId(input.razorpayOrderId),
    confirmedBy: input.confirmedBy,
    paymentMethod: "razorpay",
    paymentStatus: "paid",
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    details,
    items: pricedItems,
    subtotalAmount: amountInr,
    couponCode: couponCode || undefined,
    discountAmount: discountAmount + offerDiscount || undefined,
    totalAmount: Math.max(0, amountInr - offerDiscount - discountAmount + shippingFee),
    customerId,
  });
  if (saved && customerId) await patchDefaultAddress(customerId, details.shippingAddress);
  if (saved && writeClient) await writeClient.delete(sessionDocId(input.razorpayOrderId)).catch(() => undefined);
  return { orderNumber, saved };
}
