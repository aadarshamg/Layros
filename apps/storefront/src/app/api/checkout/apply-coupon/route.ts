import { NextRequest, NextResponse } from "next/server";
import { validateCoupon, calculateDiscount } from "@/lib/checkout/coupons";

export async function POST(request: NextRequest) {
  let body: { code?: string; subtotal?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, message: "Malformed request." }, { status: 400 });
  }

  const subtotal = typeof body.subtotal === "number" ? body.subtotal : 0;
  const result = await validateCoupon(body.code ?? "", subtotal);
  if (!result.valid || !result.coupon) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json({
    valid: true,
    message: result.message,
    coupon: result.coupon,
    discountAmount: calculateDiscount(result.coupon, subtotal),
  });
}
