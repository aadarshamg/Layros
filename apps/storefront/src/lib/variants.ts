import type { PerfumeVariant } from "@leyros/types";
import { isSoldOut } from "@/lib/stock";

/** The size every perfume opens on (product page, cards, cart suggestions). */
export const DEFAULT_SIZE_ML = 50;

type SizedVariant = Pick<PerfumeVariant, "sizeMl" | "price" | "inventoryQuantity">;

/**
 * The size a product is shown and priced at by default, so a product card,
 * its product page and every quick-add agree: 50ml when the product has it,
 * otherwise the cheapest size. Sold-out sizes are skipped while any other is
 * available.
 */
export function defaultVariant<T extends SizedVariant>(variants: readonly T[]): T | undefined {
  const available = variants.filter((variant) => !isSoldOut(variant));
  const pool = available.length ? available : [...variants];
  return pool.find((variant) => variant.sizeMl === DEFAULT_SIZE_ML) ?? [...pool].sort((a, b) => a.price - b.price)[0];
}

/** Price per 10ml for plain ml sizes (not sets or grams), for comparing sizes. */
export function pricePer10ml(variant: Pick<PerfumeVariant, "sizeMl" | "sizeLabel" | "price">): number | undefined {
  const plainMl = !variant.sizeLabel || /^\s*\d+(\.\d+)?\s*ml\s*$/i.test(variant.sizeLabel);
  if (!plainMl || !(variant.sizeMl > 0)) return undefined;
  return Math.round((variant.price / variant.sizeMl) * 10);
}

/** The available ml size that costs least per 10ml, when there's a real choice of sizes. */
export function bestValueVariant<T extends Pick<PerfumeVariant, "sizeMl" | "sizeLabel" | "price" | "inventoryQuantity">>(variants: readonly T[]): T | undefined {
  const priced = variants
    .filter((variant) => !isSoldOut(variant))
    .map((variant) => ({ variant, per10: pricePer10ml(variant) }))
    .filter((entry): entry is { variant: T; per10: number } => entry.per10 !== undefined)
    .sort((a, b) => a.per10 - b.per10);
  // Only call it out when it genuinely beats the next size.
  return priced.length > 1 && priced[0].per10 < priced[1].per10 ? priced[0].variant : undefined;
}
