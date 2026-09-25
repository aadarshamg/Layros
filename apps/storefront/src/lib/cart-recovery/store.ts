import "server-only";
import { randomBytes } from "node:crypto";
import { createClient } from "next-sanity";
import { urlForImage } from "@/lib/sanity";
import { sha256Hex } from "@/lib/auth/crypto";
import type { SanityImageSource } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

export const recoveryClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const MAX_LINES = 20;

/** Accepts "98765 43210", "+91 98765-43210", "919876543210" → "9876543210", or null if not an Indian mobile. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return INDIAN_MOBILE.test(digits) ? digits : null;
}

export function cartDocId(phone: string) {
  return `abandonedCart-${sha256Hex(`cart:${phone}`).slice(0, 32)}`;
}

export interface IncomingCartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

/** Full cart line, shaped exactly like the browser cart's CartLine so a restore can drop it straight into localStorage. */
export interface ResolvedCartLine {
  id: string;
  productId: string;
  handle: string;
  variantId: string;
  title: string;
  image?: string;
  sizeMl: number;
  sizeLabel?: string;
  sku: string;
  unitPrice: number;
  compareAtPrice?: number;
  quantity: number;
}

interface RawProduct {
  _id: string;
  title: string;
  handle?: string | null;
  image?: SanityImageSource | null;
  variants?: { id: string; sizeMl?: number | null; sizeLabel?: string | null; sku?: string | null; price?: number | null; compareAtPrice?: number | null }[] | null;
}

/**
 * Looks every line up in Sanity by product + variant id. Titles and prices
 * always come from the catalog, never from the browser — these strings end up
 * inside WhatsApp messages sent from the store's own number.
 */
export async function resolveCartLines(lines: IncomingCartLine[]): Promise<ResolvedCartLine[]> {
  if (!recoveryClient) return [];
  const valid = lines
    .filter((line) => typeof line?.productId === "string" && typeof line?.variantId === "string")
    .slice(0, MAX_LINES);
  if (valid.length === 0) return [];
  const products = await recoveryClient.fetch<RawProduct[]>(
    `*[_type == "product" && _id in $ids]{
      _id, title, "handle": slug.current, "image": images[_type == "image"][0],
      variants[]{ "id": _key, sizeMl, sizeLabel, sku, price, compareAtPrice }
    }`,
    { ids: [...new Set(valid.map((line) => line.productId))] },
  );
  const byId = new Map(products.map((product) => [product._id, product]));
  const resolved: ResolvedCartLine[] = [];
  for (const line of valid) {
    const product = byId.get(line.productId);
    const variant = product?.variants?.find((v) => v.id === line.variantId);
    if (!product || !variant || variant.price == null) continue;
    let image: string | undefined;
    try {
      image = product.image ? urlForImage(product.image).width(400).fit("max").url() : undefined;
    } catch {
      image = undefined;
    }
    resolved.push({
      id: `${line.variantId}::restored`,
      productId: product._id,
      handle: product.handle ?? product._id,
      variantId: line.variantId,
      title: product.title,
      image,
      sizeMl: variant.sizeMl ?? 50,
      sizeLabel: variant.sizeLabel ?? undefined,
      sku: variant.sku ?? "",
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice ?? undefined,
      quantity: Math.max(1, Math.min(10, Math.floor(Number(line.quantity) || 1))),
    });
  }
  return resolved;
}

type CartStatus = "active" | "converted" | "empty" | "optedOut" | "expired";

interface ExistingCart {
  status?: CartStatus;
  itemsSignature?: string;
  restoreToken?: string;
}

export async function saveCartSnapshot(input: {
  phone: string;
  name?: string;
  consent: boolean;
  source: "login" | "guest";
  lines: IncomingCartLine[];
}): Promise<{ saved: boolean; reason?: string }> {
  if (!recoveryClient) return { saved: false, reason: "unavailable" };
  const id = cartDocId(input.phone);
  const existing = await recoveryClient.fetch<ExistingCart | null>(`*[_id == $id][0]{status, itemsSignature, restoreToken}`, { id });

  // Someone who opted out stays opted out, whatever their cart does next.
  if (existing?.status === "optedOut") return { saved: false, reason: "opted-out" };

  const items = await resolveCartLines(input.lines);
  const now = new Date().toISOString();

  if (items.length === 0) {
    if (existing && existing.status === "active") {
      await recoveryClient.patch(id).set({ status: "empty", itemsSignature: "", items: [], cartTotal: 0 }).commit();
    }
    return { saved: true };
  }

  const itemsSignature = items.map((item) => `${item.variantId}x${item.quantity}`).sort().join("|");
  const isNewSession = !existing || existing.status !== "active";
  const cartChanged = isNewSession || existing?.itemsSignature !== itemsSignature;

  await recoveryClient
    .transaction()
    .createIfNotExists({ _id: id, _type: "abandonedCart", phone: input.phone, status: "active", remindersSent: 0, restoreToken: randomBytes(18).toString("base64url") })
    .patch(id, (patch) =>
      patch.set({
        phone: input.phone,
        consent: input.consent,
        source: input.source,
        status: "active",
        ...(input.name ? { name: input.name.slice(0, 80) } : {}),
        ...(cartChanged
          ? {
              items: items.map((item, index) => ({
                _key: `line${index}`,
                _type: "cartItem",
                title: item.title,
                sizeLabel: item.sizeLabel,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                productId: item.productId,
                variantId: item.variantId,
                handle: item.handle,
              })),
              cartTotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
              itemsSignature,
              updatedAt: now,
            }
          : {}),
        // A cart started after a purchase (or after emptying) is a fresh
        // shopping session, so its reminder sequence starts over.
        ...(isNewSession ? { remindersSent: 0, convertedOrderNumber: null, restoredAt: null } : {}),
      }),
    )
    .commit();
  return { saved: true };
}

export async function markCartConverted(phones: (string | null | undefined)[], orderNumber: string): Promise<void> {
  if (!recoveryClient) return;
  const unique = [...new Set(phones.map(normalizePhone).filter((phone): phone is string => !!phone))];
  for (const phone of unique) {
    const id = cartDocId(phone);
    try {
      const exists = await recoveryClient.fetch<string | null>(`*[_id == $id][0]._id`, { id });
      if (exists) {
        await recoveryClient.patch(id).set({ status: "converted", convertedOrderNumber: orderNumber }).commit();
      }
    } catch (error) {
      console.error("markCartConverted failed:", error);
    }
  }
}

export interface StoredCart {
  _id: string;
  phone: string;
  name?: string;
  status: CartStatus;
  items: { productId: string; variantId: string; quantity: number; title: string; sizeLabel?: string }[];
  cartTotal?: number;
  updatedAt: string;
  remindersSent?: number;
  lastRemindedAt?: string;
  restoreToken: string;
}

export async function findCartByToken(restoreToken: string): Promise<StoredCart | null> {
  if (!recoveryClient || !/^[A-Za-z0-9_-]{20,40}$/.test(restoreToken)) return null;
  return recoveryClient.fetch<StoredCart | null>(
    `*[_type == "abandonedCart" && restoreToken == $restoreToken][0]{_id, phone, name, status, items, cartTotal, updatedAt, remindersSent, lastRemindedAt, restoreToken}`,
    { restoreToken },
  );
}
