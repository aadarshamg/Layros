import type { PerfumeVariant } from "@leyros/types";

// Stock is opt-in per size: a blank "Stock on hand" in admin means the size
// isn't tracked and is always buyable. A number is counted down by orders
// (see lib/checkout/stock.ts), shows Sold out at 0 and alerts at this level.
export const LOW_STOCK_THRESHOLD = 5;

type Stocked = Pick<PerfumeVariant, "inventoryQuantity">;

export const isStockTracked = (variant: Stocked): variant is Stocked & { inventoryQuantity: number } =>
  typeof variant.inventoryQuantity === "number";

export const isSoldOut = (variant: Stocked) => isStockTracked(variant) && variant.inventoryQuantity <= 0;

/** Most that can be bought right now, or undefined when the size isn't tracked. */
export const availableQuantity = (variant: Stocked) =>
  isStockTracked(variant) ? Math.max(0, variant.inventoryQuantity) : undefined;
