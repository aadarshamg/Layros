import type { PerfumeProduct } from "@leyros/types";

const NON_PERFUME_CATEGORY = /^(Fragrance Candles|Car Perfumes|Festival Gift Packs)/i;

/** "Men" / "Women" / "Unisex" for wearable fragrances; null for candles, car fresheners and hampers. */
export function genderLabel(product: PerfumeProduct): string | null {
  if (NON_PERFUME_CATEGORY.test(product.category ?? "")) return null;
  if (product.details.gender === "masculine") return "Men";
  if (product.details.gender === "feminine") return "Women";
  return "Unisex";
}
