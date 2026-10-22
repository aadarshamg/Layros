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
