import type { PerfumeProduct } from "@leyros/types";

const NON_PERFUME_CATEGORY = /^(Fragrance Candles|Car Perfumes|Festival Gift Packs)/i;

/** "Men" / "Women" / "Unisex" for wearable fragrances; null for candles, car fresheners and hampers. */
export function genderLabel(product: PerfumeProduct): string | null {
  if (NON_PERFUME_CATEGORY.test(product.category ?? "")) return null;
  if (product.details.gender === "masculine") return "Men";
  if (product.details.gender === "feminine") return "Women";
  return "Unisex";
}

export function productCardCategoryLabel(product: PerfumeProduct): string {
  const gender = genderLabel(product);
  if (gender) return gender;

  const category = product.category ?? "";
  if (/car perfume/i.test(category)) return "Car Perfume";
  if (/candle/i.test(category)) return "Candle";
  if (/gift|hamper/i.test(category)) return "Gift Pack";
  if (/attar/i.test(category)) return "Attar";
  return "Leyros";
}

/** Compact merchandising name for product cards; the source title remains untouched. */
export function productCardTitle(product: PerfumeProduct): string {
  const category = productCardCategoryLabel(product);
  let name = product.title
    .split("|")[0]
    .split(/\s+[–—-]\s+/)[0]
    .replace(/\([^)]*(?:ml|gm|grams?|set of)[^)]*\)/gi, "")
    .replace(/["“”']?(?:men(?:'s)?|women(?:'s)?|unisex)["“”']?\s+(?=(?:perfume|fragrance|inspired)\b)/gi, "")
    .replace(/\b(?:eau de parfum|eau de toilette|perfume|fragrance|parfum|edp|inspired)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) name = product.brand || "Leyros";
  return `${name.toLocaleUpperCase("en-IN")} (${category.toLocaleUpperCase("en-IN")})`;
}
