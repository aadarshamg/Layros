import "server-only";
import { createClient } from "next-sanity";
import { formatSize } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";
import { sendLowStockAlert } from "@/lib/stock-alerts";

// Counts tracked stock down when an order is placed and back up when it's
// cancelled. Untracked sizes (blank "Stock on hand") are left alone.

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const writeClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;

interface OrderStockDoc {
  _id: string;
  _rev: string;
  orderNumber: string;
  stockDeducted?: boolean;
  stockRestored?: boolean;
  items?: { productId?: string; variantKey?: string; quantity?: number }[];
}

interface ProductStockDoc {
  _id: string;
  _rev: string;
  title: string;
  variants?: { _key: string; sizeMl?: number; sizeLabel?: string; inventoryQuantity?: number }[];
}

/** Claims a one-time step on the order; false if it was already done or someone else got there first. */
async function claim(order: OrderStockDoc, field: "stockDeducted" | "stockRestored") {
  if (!writeClient) return false;
  try {
    await writeClient.patch(order._id).ifRevisionId(order._rev).set({ [field]: true }).commit();
    return true;
  } catch {
    return false;
  }
}

/** Adds `change` (negative to deduct) to one product's tracked sizes, retrying on concurrent edits. */
async function adjustProduct(productId: string, changes: Map<string, number>) {
  if (!writeClient) return;
  for (let attempt = 0; attempt < 4; attempt++) {
    const product = await writeClient.fetch<ProductStockDoc | null>(
      `*[_id == $id][0]{_id, _rev, title, variants[]{_key, sizeMl, sizeLabel, inventoryQuantity}}`,
      { id: productId },
    );
    if (!product) return;
    const updates: Record<string, number> = {};
    const alerts: { size: string; left: number }[] = [];
    for (const variant of product.variants ?? []) {
      const change = changes.get(variant._key);
      if (!change || typeof variant.inventoryQuantity !== "number") continue;
      const before = variant.inventoryQuantity;
      const after = Math.max(0, before + change);
      updates[`variants[_key=="${variant._key}"].inventoryQuantity`] = after;
      // Alert once on dropping to the threshold, and again when it sells out.
      if (change < 0 && ((before > LOW_STOCK_THRESHOLD && after <= LOW_STOCK_THRESHOLD) || (before > 0 && after === 0))) {
        alerts.push({ size: formatSize(variant.sizeMl ?? 0, variant.sizeLabel), left: after });
      }
    }
    if (Object.keys(updates).length === 0) return;
    try {
      await writeClient.patch(product._id).ifRevisionId(product._rev).set(updates).commit();
    } catch {
      continue; // Someone saved the product meanwhile — read it again and retry.
    }
    for (const alert of alerts) await sendLowStockAlert({ title: product.title, ...alert });
    return;
  }
  console.error("Stock update gave up after retries:", productId);
}

async function adjustForOrder(orderDocId: string, direction: "deduct" | "restore") {
  if (!writeClient) return;
  const order = await writeClient.fetch<OrderStockDoc | null>(
    `*[_id == $id][0]{_id, _rev, orderNumber, stockDeducted, stockRestored, items[]{productId, variantKey, quantity}}`,
    { id: orderDocId },
  );
  if (!order) return;
  if (direction === "deduct" ? order.stockDeducted : !order.stockDeducted || order.stockRestored) return;
  if (!(await claim(order, direction === "deduct" ? "stockDeducted" : "stockRestored"))) return;

  const byProduct = new Map<string, Map<string, number>>();
  for (const item of order.items ?? []) {
    if (!item.productId || !item.variantKey || !item.quantity) continue;
    const changes = byProduct.get(item.productId) ?? new Map<string, number>();
    const sign = direction === "deduct" ? -1 : 1;
    changes.set(item.variantKey, (changes.get(item.variantKey) ?? 0) + sign * item.quantity);
    byProduct.set(item.productId, changes);
  }
  for (const [productId, changes] of byProduct) {
    try {
      await adjustProduct(productId, changes);
    } catch (error) {
      console.error(`Stock ${direction} failed:`, order.orderNumber, productId, error);
    }
  }
}

/** Counts an order's items off stock, once per order. Never throws. */
export async function deductStockForOrder(orderDocId: string) {
  await adjustForOrder(orderDocId, "deduct").catch((error) => console.error("deductStockForOrder failed:", orderDocId, error));
}

/** Puts a cancelled order's items back into stock, once per order. Never throws. */
export async function restoreStockForOrder(orderDocId: string) {
  await adjustForOrder(orderDocId, "restore").catch((error) => console.error("restoreStockForOrder failed:", orderDocId, error));
}

/** Cancelled orders whose stock hasn't been put back yet (e.g. cancelled by hand in admin). */
export async function restoreCancelledOrders(limit: number) {
  if (!writeClient) return 0;
  const ids = await writeClient.fetch<string[]>(
    `*[_type == "order" && fulfillmentStatus == "Cancelled" && stockDeducted == true && stockRestored != true][0...$limit]._id`,
    { limit },
  );
  for (const id of ids) await restoreStockForOrder(id);
  return ids.length;
}
