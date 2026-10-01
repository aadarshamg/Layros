import type { PerfumeProduct } from "@leyros/types";

export type CouponOfferCategory = "candles" | "car-perfumes" | "luxury-gift-sets" | "travel-packs";

export interface CategoryCouponOffer {
  code: string;
  percent: number;
  minimum: number;
  category: CouponOfferCategory;
}

export const CATEGORY_COUPON_OFFERS: Record<CouponOfferCategory, CategoryCouponOffer[]> = {
  candles: [
    { code: "GLOW10", percent: 10, minimum: 999, category: "candles" },
    { code: "GLOW20", percent: 20, minimum: 1999, category: "candles" },
  ],
  "car-perfumes": [
    { code: "DRIVE10", percent: 10, minimum: 999, category: "car-perfumes" },
    { code: "DRIVE20", percent: 20, minimum: 1999, category: "car-perfumes" },
  ],
  "luxury-gift-sets": [
    { code: "GIFT10", percent: 10, minimum: 999, category: "luxury-gift-sets" },
    { code: "GIFT20", percent: 20, minimum: 1999, category: "luxury-gift-sets" },
  ],
  "travel-packs": [
    { code: "TRAVEL10", percent: 10, minimum: 999, category: "travel-packs" },
    { code: "TRAVEL20", percent: 20, minimum: 1999, category: "travel-packs" },
  ],
};

export const COUPON_CATEGORY_LABELS: Record<CouponOfferCategory, string> = {
  candles: "Candles",
  "car-perfumes": "Car Perfumes",
  "luxury-gift-sets": "Luxury Gift Sets",
  "travel-packs": "Travel Packs",
};

export function getCouponOfferCategory(...values: Array<string | null | undefined>): CouponOfferCategory | null {
  const searchable = values.filter(Boolean).join(" ").toLowerCase();
  if (/car[ -]?(perfume|fragrance)|automotive fragrance/.test(searchable)) return "car-perfumes";
  if (/travel[ -]?(pack|set|kit)|pocket perfume/.test(searchable)) return "travel-packs";
  if (/luxury gift|gift[ -]?(set|pack|box)|coffret/.test(searchable)) return "luxury-gift-sets";
  if (/candle|wax/.test(searchable)) return "candles";
  return null;
}

export function getProductCouponCategory(product: PerfumeProduct) {
  return getCouponOfferCategory(product.category, product.title, ...product.tags);
}

export function isBuyTwoGetOneEligibleText(...values: Array<string | null | undefined>) {
  const searchable = values.filter(Boolean).join(" ").toLowerCase();
  if (BUY_TWO_GET_ONE_EXCLUSIONS.some((term) => searchable.includes(term))) return false;
  return searchable.includes("attar") || searchable.includes("perfume") || searchable.includes("collection");
}

export interface PromotionLine {
  title: string;
  category?: string;
  unitPrice: number;
  quantity: number;
}

export function calculateBuyTwoGetOne(lines: PromotionLine[]) {
  const eligibleUnitPrices = lines
    .filter((line) => isBuyTwoGetOneEligibleText(line.category, line.title))
    .flatMap((line) => Array.from({ length: Math.max(0, Math.floor(line.quantity)) }, () => line.unitPrice))
    .sort((a, b) => a - b);
  const freeItemCount = Math.floor(eligibleUnitPrices.length / 3);
  const discountAmount = eligibleUnitPrices.slice(0, freeItemCount).reduce((sum, price) => sum + price, 0);
  return { eligibleItemCount: eligibleUnitPrices.length, freeItemCount, discountAmount };
}

const BUY_TWO_GET_ONE_EXCLUSIONS = [
  "candle",
  "car perfume",
  "car fragrance",
  "luxury gift",
  "gift set",
  "gift pack",
  "travel pack",
  "travel set",
] as const;

/**
 * The Buy 2 Get 1 Free promotion is intentionally limited to personal
 * perfumes and attars. Explicit exclusions win over every inclusion so a
 * gift set containing perfume, for example, can never be marked eligible.
 */
export function isBuyTwoGetOneEligible(product: PerfumeProduct) {
  return isBuyTwoGetOneEligibleText(product.category, product.title, ...product.tags);
}
