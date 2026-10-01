import { NextRequest, NextResponse } from "next/server";
import { validateCoupon, calculateDiscount } from "@/lib/checkout/coupons";
import { priceItems, type IncomingItem } from "@/lib/checkout/pricing";

export async function POST(request: NextRequest) {
  let body: { code?: string; items?: IncomingItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, message: "Malformed request." }, { status: 400 });
  }

  let pricing;
  try {
    pricing = await priceItems(body.items ?? []);
  } catch (error) {
    return NextResponse.json({ valid: false, message: error instanceof Error ? error.message : "Invalid cart." }, { status: 200 });
  }
  const result = await validateCoupon(body.code ?? "", pricing.amountInr, pricing.items);
  if (!result.valid || !result.coupon) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json({
    valid: true,
    message: result.message,
    coupon: result.coupon,
    discountAmount: calculateDiscount(result.coupon, pricing.amountInr, pricing.items),
  });
}
