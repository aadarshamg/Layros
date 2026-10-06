import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import type { IncomingItem } from "@/lib/checkout/pricing";
import { finalizeRazorpayOrder, findRecordedOrderNumber, getCheckoutSession, razorpayOrderNumber, type CheckoutSession } from "@/lib/checkout/finalize";
import { getSessionCustomerId } from "@/lib/auth/session";
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

  const sessionCustomerId = await getSessionCustomerId();
  const saved = await getCheckoutSession(razorpay_order_id);
  // Prefer what this page sent; fall back to the copy saved when payment started.
  const session: CheckoutSession | null =
    items?.length && details
      ? { items, details, couponCode, customerId: sessionCustomerId ?? saved?.customerId }
      : saved;

  let orderNumber = (await findRecordedOrderNumber(razorpay_order_id)) ?? razorpayOrderNumber(razorpay_order_id);
  if (session) {
    try {
      // The payment itself is already secured (the amount was fixed at
      // create-order time from catalog prices) — this only writes the order record.
      ({ orderNumber } = await finalizeRazorpayOrder({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        session,
        confirmedBy: "browser",
      }));
    } catch (error) {
      // Payment already succeeded — never fail the customer's checkout over
      // record-keeping; the Razorpay webhook retries saving the order.
      console.error("Order record-keeping failed after successful payment:", razorpay_payment_id, error);
    }
  } else {
    console.warn("Verified payment without order details; left for the webhook:", razorpay_payment_id);
  }

  return NextResponse.json({ verified: true, paymentId: razorpay_payment_id, orderNumber });
}
