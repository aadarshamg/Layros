import "server-only";
import { sanityClient, SANITY_FETCH_OPTIONS } from "@/lib/sanity";

export interface CouponRule {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrderAmount?: number;
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
}

/** Looks up a coupon by code and checks it's active, not expired, and the order meets its minimum — never trusts a discount the client claims. */
export async function validateCoupon(rawCode: string, subtotal: number): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, message: "Enter a coupon code." };

  const coupon = await sanityClient.fetch<RawCoupon | null>(
    `*[_type == "coupon" && code == $code][0]{ code, discountType, discountValue, minOrderAmount, active, expiresAt }`,
    { code },
    SANITY_FETCH_OPTIONS,
  );

  if (!coupon || !coupon.active) {
    return { valid: false, message: "That coupon code isn't valid." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: "That coupon has expired." };
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

export function calculateDiscount(coupon: CouponRule, subtotal: number): number {
  const raw = coupon.discountType === "percent" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  return Math.min(Math.round(raw), subtotal);
}
