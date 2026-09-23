import { NextRequest, NextResponse } from "next/server";
import { priceItems, type IncomingItem } from "@/lib/checkout/pricing";
import { validateCoupon, calculateDiscount } from "@/lib/checkout/coupons";

export async function POST(request: NextRequest) {
  let body: {
    items?: IncomingItem[];
    details?: { email?: string; shippingAddress?: { city?: string } };
    couponCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  let amountInr: number;
  try {
    ({ amountInr } = await priceItems(body.items ?? []));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid cart." }, { status: 400 });
  }

  // Re-validate the coupon server-side against the re-priced subtotal —
  // never trust a discount amount the client computed itself.
  let discountAmount = 0;
  if (body.couponCode) {
    const result = await validateCoupon(body.couponCode, amountInr);
    if (result.valid && result.coupon) {
      discountAmount = calculateDiscount(result.coupon, amountInr);
    }
  }
  const chargeAmount = Math.max(0, amountInr - discountAmount);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET." },
      { status: 503 },
    );
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  let razorpayResponse: Response;
  try {
    razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: Math.round(chargeAmount * 100), // Razorpay wants paise, not rupees.
        currency: "INR",
        receipt: `leyros-${Date.now()}`,
        notes: {
          email: body.details?.email ?? "",
          city: body.details?.shippingAddress?.city ?? "",
          couponCode: body.couponCode ?? "",
        },
      }),
    });
  } catch (error) {
    console.error("Razorpay order request failed:", error);
    return NextResponse.json({ error: "Could not reach the payment provider. Please try again." }, { status: 502 });
  }

  if (!razorpayResponse.ok) {
    const errorBody = await razorpayResponse.text();
    console.error("Razorpay order creation failed:", razorpayResponse.status, errorBody);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }

  const order = await razorpayResponse.json();
  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
}
