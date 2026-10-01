import { NextRequest, NextResponse } from "next/server";
import { priceItems, type IncomingItem } from "@/lib/checkout/pricing";
import { validateCoupon, calculateDiscount } from "@/lib/checkout/coupons";
import { calculateBuyTwoGetOne } from "@/lib/promotions";
import { shippingFeeFor } from "@/lib/shipping";
import { saveCheckoutSession } from "@/lib/checkout/finalize";
import { getSessionCustomerId } from "@/lib/auth/session";
import type { CheckoutDetailsFormData } from "@leyros/types";

export async function POST(request: NextRequest) {
  let body: {
    items?: IncomingItem[];
    details?: CheckoutDetailsFormData;
    couponCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  let pricing;
  try {
    pricing = await priceItems(body.items ?? []);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid cart." }, { status: 400 });
  }

  // Re-validate the coupon server-side against the re-priced subtotal —
  // never trust a discount amount the client computed itself.
  let discountAmount = 0;
  if (body.couponCode) {
    const result = await validateCoupon(body.couponCode, pricing.amountInr, pricing.items);
    if (result.valid && result.coupon) {
      discountAmount = calculateDiscount(result.coupon, pricing.amountInr, pricing.items);
    }
  }
  const offerDiscount = calculateBuyTwoGetOne(pricing.items).discountAmount;
  const shippingFee = shippingFeeFor(pricing.amountInr);
  const chargeAmount = Math.max(0, pricing.amountInr - offerDiscount - discountAmount + shippingFee);

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
          buyTwoGetOneDiscount: String(offerDiscount),
          shippingFee: String(shippingFee),
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
  // Lets the Razorpay webhook record the order even if the shopper closes the page right after paying.
  if (body.details && body.items?.length) {
    await saveCheckoutSession(order.id, {
      items: body.items,
      details: body.details,
      couponCode: body.couponCode,
      customerId: (await getSessionCustomerId()) ?? undefined,
    });
  }
  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
}
