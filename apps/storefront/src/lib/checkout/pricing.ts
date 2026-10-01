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
  category?: string;
}

export interface PricingResult {
  items: PricedItem[];
  amountInr: number;
}

/** Builds a sku -> current price map straight from Sanity — never trust a price the client sends. */
async function fetchPriceBySku(): Promise<Map<string, { price: number; category?: string; title: string }>> {
  const products = await sanityClient.fetch<{ title: string; category?: string; variants: { sku?: string; price?: number }[] }[]>(
    `*[_type == "product"]{ title, category, variants[]{sku, price} }`,
  );
  const priceBySku = new Map<string, { price: number; category?: string; title: string }>();
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      if (variant.sku) priceBySku.set(variant.sku, { price: variant.price ?? 0, category: product.category, title: product.title });
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
    const pricedVariant = priceBySku.get(item.sku);
    if (pricedVariant === undefined) {
      throw new Error(`"${item.title}" is no longer available.`);
    }
    const quantity = Math.max(1, Math.min(10, Math.floor(item.quantity)));
    amountInr += pricedVariant.price * quantity;
    priced.push({ sku: item.sku, title: pricedVariant.title, sizeLabel: item.sizeLabel, quantity, unitPrice: pricedVariant.price, category: pricedVariant.category });
  }

  if (amountInr <= 0) {
    throw new Error("Nothing to charge.");
  }

  return { items: priced, amountInr };
}
