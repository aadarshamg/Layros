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
}

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
export async function validateCoupon(rawCode: string, subtotal: number, items: CouponLineItem[] = []): Promise<CouponValidationResult> {
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

export function calculateDiscount(coupon: CouponRule, subtotal: number, items: CouponLineItem[] = []): number {
  const qualifyingSubtotal = eligibleSubtotal(coupon, subtotal, items);
  const raw = coupon.discountType === "percent" ? (qualifyingSubtotal * coupon.discountValue) / 100 : coupon.discountValue;
  return Math.min(Math.round(raw), qualifyingSubtotal);
}
