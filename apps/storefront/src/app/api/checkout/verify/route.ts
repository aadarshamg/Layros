import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { priceItems, type IncomingItem } from "@/lib/checkout/pricing";
import { validateCoupon, calculateDiscount } from "@/lib/checkout/coupons";
import { generateOrderNumber, saveOrder } from "@/lib/checkout/orders";
import { getSessionCustomerId } from "@/lib/auth/session";
import { patchDefaultAddress } from "@/lib/auth/customers";
import type { CheckoutDetailsFormData } from "@leyros/types";

interface VerifyPayload {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  items?: IncomingItem[];
  details?: CheckoutDetailsFormData;
  couponCode?: string;
}

export async function POST(request: NextRequest) {
  let body: VerifyPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, details, couponCode } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
  }

  // Razorpay's documented verification scheme: HMAC-SHA256 of
  // "order_id|payment_id" using the account's key secret must match the
  // signature Razorpay returned. This is what proves the payment response
  // actually came from Razorpay and wasn't forged client-side.
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.error("Razorpay signature mismatch for order", razorpay_order_id);
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  const orderNumber = generateOrderNumber();
  const customerId = await getSessionCustomerId();

  // The payment itself is already secured (the amount was locked in at
  // create-order time from Sanity's real prices) — items/details here are
  // only for the order *record*, so a re-priced total is still used rather
  // than trusting the client's numbers outright.
  if (items?.length && details) {
    try {
      const { items: pricedItems, amountInr } = await priceItems(items);
      let discountAmount = 0;
      if (couponCode) {
        const couponResult = await validateCoupon(couponCode, amountInr);
        if (couponResult.valid && couponResult.coupon) {
          discountAmount = calculateDiscount(couponResult.coupon, amountInr);
        }
      }
      await saveOrder({
        orderNumber,
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        details,
        items: pricedItems,
        subtotalAmount: amountInr,
        couponCode: couponCode || undefined,
        discountAmount: discountAmount || undefined,
        totalAmount: Math.max(0, amountInr - discountAmount),
        customerId: customerId ?? undefined,
      });
      if (customerId) await patchDefaultAddress(customerId, details.shippingAddress);
    } catch (error) {
      // Payment already succeeded — never fail the customer's checkout over
      // a record-keeping problem, just log it for manual follow-up.
      console.error("Order record-keeping failed after successful payment:", razorpay_payment_id, error);
    }
  } else {
    console.warn("Verified payment without order details — nothing saved:", razorpay_payment_id);
  }

  return NextResponse.json({ verified: true, paymentId: razorpay_payment_id, orderNumber });
}
