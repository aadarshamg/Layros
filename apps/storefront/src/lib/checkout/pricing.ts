import "server-only";
import { sanityClient } from "@/lib/sanity";

export interface IncomingItem {
  sku: string;
  title: string;
  sizeLabel?: string;
  quantity: number;
}

export interface PricedItem {
  sku: string;
  title: string;
  sizeLabel?: string;
  quantity: number;
  unitPrice: number;
}

export interface PricingResult {
  items: PricedItem[];
  amountInr: number;
}

/** Builds a sku -> current price map straight from Sanity — never trust a price the client sends. */
async function fetchPriceBySku(): Promise<Map<string, number>> {
  const products = await sanityClient.fetch<{ variants: { sku?: string; price?: number }[] }[]>(
    `*[_type == "product"]{ variants[]{sku, price} }`,
  );
  const priceBySku = new Map<string, number>();
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      if (variant.sku) priceBySku.set(variant.sku, variant.price ?? 0);
    }
  }
  return priceBySku;
}

/**
 * Re-prices every cart line from Sanity's live data and returns the real
 * total — shared by both the Razorpay and Cash on Delivery order paths so
 * neither can be shortchanged by a tampered client-side price.
 * Throws a plain Error with a user-facing message on any invalid item.
 */
export async function priceItems(items: IncomingItem[]): Promise<PricingResult> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }
  const priceBySku = await fetchPriceBySku();

  const priced: PricedItem[] = [];
  let amountInr = 0;
  for (const item of items) {
    const price = priceBySku.get(item.sku);
    if (price === undefined) {
      throw new Error(`"${item.title}" is no longer available.`);
    }
    const quantity = Math.max(1, Math.min(10, Math.floor(item.quantity)));
    amountInr += price * quantity;
    priced.push({ sku: item.sku, title: item.title, sizeLabel: item.sizeLabel, quantity, unitPrice: price });
  }

  if (amountInr <= 0) {
    throw new Error("Nothing to charge.");
  }

  return { items: priced, amountInr };
}
