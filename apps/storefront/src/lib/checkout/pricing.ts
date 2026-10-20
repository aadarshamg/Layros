import "server-only";
import { sanityClient } from "@/lib/sanity";
import { formatSize } from "@/lib/format";

export interface IncomingItem {
  /** Product document id and variant _key — the reliable way to find a size, since SKUs repeat across products. */
  productId?: string;
  variantId?: string;
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
  /** Set when the line matched a specific product size, so stock can be counted down. */
  productId?: string;
  variantKey?: string;
}

export interface PricingResult {
  items: PricedItem[];
  amountInr: number;
}

interface CatalogVariant {
  productId: string;
  variantKey: string;
  title: string;
  category?: string;
  price: number;
  sizeMl?: number;
  sizeLabel?: string;
  inventoryQuantity?: number;
}

/** Every size in the catalog straight from Sanity — never trust a price or stock count the client sends. */
async function fetchCatalog() {
  const products = await sanityClient.fetch<{
    _id: string;
    title: string;
    category?: string;
    variants?: { _key: string; sku?: string; price?: number; sizeMl?: number; sizeLabel?: string; inventoryQuantity?: number }[];
  }[]>(`*[_type == "product" && !(_id in path("drafts.**"))]{ _id, title, category, variants[]{_key, sku, price, sizeMl, sizeLabel, inventoryQuantity} }`, {}, { cache: "no-store" });

  const byVariant = new Map<string, CatalogVariant>();
  const byKey = new Map<string, CatalogVariant>();
  const bySku = new Map<string, CatalogVariant>();
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      const entry: CatalogVariant = {
        productId: product._id,
        variantKey: variant._key,
        title: product.title,
        category: product.category,
        price: variant.price ?? 0,
        sizeMl: variant.sizeMl,
        sizeLabel: variant.sizeLabel,
        inventoryQuantity: typeof variant.inventoryQuantity === "number" ? variant.inventoryQuantity : undefined,
      };
      byVariant.set(`${product._id}:${variant._key}`, entry);
      byKey.set(variant._key, entry);
      // SKUs aren't unique in the migrated catalog; the first one wins, as before.
      if (variant.sku && !bySku.has(variant.sku)) bySku.set(variant.sku, entry);
    }
  }
  return (item: IncomingItem) =>
    (item.productId && item.variantId && byVariant.get(`${item.productId}:${item.variantId}`)) ||
    (item.variantId && byKey.get(item.variantId)) ||
    bySku.get(item.sku);
}

/**
 * Re-prices every cart line from Sanity's live data and returns the real
 * total — shared by both the Razorpay and Cash on Delivery order paths so
 * neither can be shortchanged by a tampered client-side price.
 * Throws a plain Error with a user-facing message on any invalid item.
 *
 * `checkStock` refuses lines beyond a tracked size's stock. Use it before
 * taking an order, never after a payment has already gone through.
 */
export async function priceItems(items: IncomingItem[], { checkStock = false }: { checkStock?: boolean } = {}): Promise<PricingResult> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }
  const findVariant = await fetchCatalog();

  const priced: PricedItem[] = [];
  const requested = new Map<string, number>();
  let amountInr = 0;
  for (const item of items) {
    const variant = findVariant(item);
    if (!variant) {
      throw new Error(`"${item.title}" is no longer available.`);
    }
    const quantity = Math.max(1, Math.min(10, Math.floor(item.quantity)));
    const sizeLabel = item.sizeLabel ?? variant.sizeLabel;

    if (checkStock && variant.inventoryQuantity !== undefined) {
      const key = `${variant.productId}:${variant.variantKey}`;
      const total = (requested.get(key) ?? 0) + quantity;
      requested.set(key, total);
      const left = Math.max(0, variant.inventoryQuantity);
      const name = `${variant.title.split("|")[0].trim()} (${formatSize(variant.sizeMl ?? 0, sizeLabel)})`;
      if (left === 0) throw new Error(`${name} is sold out. Please remove it from your bag.`);
      if (total > left) throw new Error(`Only ${left} left of ${name}. Please lower the quantity.`);
    }

    amountInr += variant.price * quantity;
    priced.push({
      sku: item.sku,
      title: variant.title,
      sizeLabel: item.sizeLabel,
      quantity,
      unitPrice: variant.price,
      category: variant.category,
      productId: variant.productId,
      variantKey: variant.variantKey,
    });
  }

  if (amountInr <= 0) {
    throw new Error("Nothing to charge.");
  }

  return { items: priced, amountInr };
}
