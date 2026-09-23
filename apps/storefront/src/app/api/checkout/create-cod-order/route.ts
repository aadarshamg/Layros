import { NextRequest, NextResponse } from "next/server";
import { priceItems, type IncomingItem } from "@/lib/checkout/pricing";
import { validateCoupon, calculateDiscount } from "@/lib/checkout/coupons";
import { generateOrderNumber, saveOrder } from "@/lib/checkout/orders";
import { getSessionCustomerId } from "@/lib/auth/session";
import { patchDefaultAddress } from "@/lib/auth/customers";
import type { CheckoutDetailsFormData } from "@leyros/types";

export async function POST(request: NextRequest) {
  let body: { items?: IncomingItem[]; details?: CheckoutDetailsFormData; couponCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!body.details) {
    return NextResponse.json({ error: "Missing delivery details." }, { status: 400 });
  }

  // COD has no payment gateway backing it, so it's the one path abuse-prone
  // enough to gate behind a real account — checked server-side since a
  // guest could otherwise call this route directly regardless of what the
  // checkout UI offers.
  const sessionCustomerId = await getSessionCustomerId();
  if (!sessionCustomerId) {
    return NextResponse.json({ error: "Log in to use Cash on Delivery." }, { status: 401 });
  }

  let pricing;
  try {
    pricing = await priceItems(body.items ?? []);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid cart." }, { status: 400 });
  }

  let discountAmount = 0;
  if (body.couponCode) {
    const couponResult = await validateCoupon(body.couponCode, pricing.amountInr);
    if (couponResult.valid && couponResult.coupon) {
      discountAmount = calculateDiscount(couponResult.coupon, pricing.amountInr);
    }
  }
  const totalAmount = Math.max(0, pricing.amountInr - discountAmount);

  const orderNumber = generateOrderNumber();
  const saved = await saveOrder({
    orderNumber,
    paymentMethod: "cod",
    paymentStatus: "pending",
    details: body.details,
    items: pricing.items,
    subtotalAmount: pricing.amountInr,
    couponCode: body.couponCode || undefined,
    discountAmount: discountAmount || undefined,
    totalAmount,
    customerId: sessionCustomerId,
  });

  // Unlike Razorpay, COD has no gateway-side record to fall back on — if we
  // couldn't save it, there is no order, so say so rather than confirming
  // something that doesn't actually exist anywhere.
  if (!saved) {
    return NextResponse.json({ error: "Could not place your order. Please try again." }, { status: 502 });
  }
  await patchDefaultAddress(sessionCustomerId, body.details.shippingAddress);

  return NextResponse.json({ orderNumber, totalAmount });
}
