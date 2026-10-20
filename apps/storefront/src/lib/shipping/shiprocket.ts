import "server-only";
import { createClient } from "next-sanity";
import { restoreStockForOrder } from "@/lib/checkout/stock";

// Sends saved website orders to Shiprocket as "New" orders. Courier choice,
// AWB and pickup are then done by hand in the Shiprocket panel; tracking
// comes back through /api/shipping/courier-updates.

const API = "https://apiv2.shiprocket.in/v1/external";
const email = process.env.SHIPROCKET_EMAIL;
const password = process.env.SHIPROCKET_PASSWORD;
/** Nickname of the pickup address under Shiprocket → Settings → Pickup Addresses. */
const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "work";

// One default box per order until products carry their own weights: 0.5 kg
// for the first item, plus a little for each extra bottle.
const BOX = { lengthCm: 15, breadthCm: 12, heightCm: 10 };
const FIRST_ITEM_KG = 0.5;
const EXTRA_ITEM_KG = 0.15;
/** HSN 3303: perfumes and toilet waters (attars included). */
const DEFAULT_HSN = "3303";
/** A "sending" mark older than this is treated as a crashed attempt and retried. */
const STALE_SENDING_MS = 10 * 60 * 1000;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const writeClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;

export const isShiprocketConfigured = () => Boolean(email && password && writeClient);

// Shiprocket tokens last 10 days; refresh a day early. Kept per server
// instance, so a cold start simply logs in again.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!response.ok || !data.token) throw new Error(`Shiprocket login failed (${response.status}): ${data.message ?? "no token"}`);
  cachedToken = { value: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return data.token;
}

async function shiprocketRequest<T>(path: string, body?: unknown): Promise<T> {
  for (const forceRefresh of [false, true]) {
    const response = await fetch(`${API}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken(forceRefresh)}` },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if (response.status === 401 && !forceRefresh) continue;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = (data as { errors?: unknown; message?: string }).errors ?? (data as { message?: string }).message;
      throw new Error(`Shiprocket ${path} failed (${response.status}): ${JSON.stringify(detail ?? data)}`);
    }
    return data as T;
  }
  throw new Error(`Shiprocket ${path} failed: unauthorized`);
}

interface OrderDoc {
  _id: string;
  _rev: string;
  _createdAt: string;
  orderNumber: string;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "paid" | "pending" | "failed";
  customerEmail?: string;
  customerPhone?: string;
  customer?: { _ref: string };
  shippingAddress?: {
    fullName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  items?: { title?: string; sku?: string; sizeLabel?: string; unitPrice?: number; quantity?: number }[];
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  giftWrapMessage?: string;
  shiprocketOrderId?: string;
  shiprocketSyncStatus?: "sending" | "sent" | "failed";
  shiprocketSyncStartedAt?: string;
}

/** Shiprocket wants "YYYY-MM-DD HH:mm" in India time. */
function indiaDateTime(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function tenDigitPhone(...candidates: Array<string | undefined>) {
  for (const candidate of candidates) {
    const digits = candidate?.replace(/\D/g, "").slice(-10);
    if (digits && digits.length === 10) return digits;
  }
  return "";
}

function buildPayload(order: OrderDoc) {
  const address = order.shippingAddress ?? {};
  const [firstName, ...rest] = (address.fullName ?? "Customer").trim().split(/\s+/);
  const items = (order.items ?? []).filter((item) => (item.quantity ?? 0) > 0);
  const units = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const subTotal = order.subtotalAmount ?? items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 0), 0);
  const discount = order.discountAmount ?? 0;
  // The order stores subtotal, discount and total; the gap is the shipping fee.
  const shipping = Math.max(0, order.totalAmount - subTotal + discount);

  return {
    order_id: order.orderNumber,
    order_date: indiaDateTime(order._createdAt),
    pickup_location: pickupLocation,
    comment: order.giftWrapMessage ? `Gift wrap: ${order.giftWrapMessage}` : undefined,
    billing_customer_name: firstName,
    billing_last_name: rest.join(" "),
    billing_address: address.addressLine1 ?? "",
    billing_address_2: address.addressLine2 ?? "",
    billing_city: address.city ?? "",
    billing_pincode: address.postalCode ?? "",
    billing_state: address.state ?? "",
    billing_country: "India",
    billing_email: order.customerEmail ?? "",
    billing_phone: tenDigitPhone(order.customerPhone, order.customer?._ref),
    shipping_is_billing: true,
    order_items: items.map((item, index) => ({
      name: [item.title, item.sizeLabel].filter(Boolean).join(" - ") || `Item ${index + 1}`,
      sku: item.sku || `${order.orderNumber}-${index + 1}`,
      units: item.quantity,
      selling_price: item.unitPrice ?? 0,
      hsn: DEFAULT_HSN,
    })),
    payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
    shipping_charges: shipping,
    total_discount: discount,
    sub_total: subTotal,
    length: BOX.lengthCm,
    breadth: BOX.breadthCm,
    height: BOX.heightCm,
    weight: Number((FIRST_ITEM_KG + Math.max(0, units - 1) * EXTRA_ITEM_KG).toFixed(2)),
  };
}

const ORDER_FIELDS = `_id, _rev, _createdAt, orderNumber, paymentMethod, paymentStatus, customerEmail, customerPhone, customer,
  shippingAddress, items, subtotalAmount, discountAmount, totalAmount, giftWrapMessage,
  shiprocketOrderId, shiprocketSyncStatus, shiprocketSyncStartedAt`;

/**
 * Sends one saved order to Shiprocket, at most once. Safe to call from both
 * the browser confirmation and the Razorpay webhook: the first caller claims
 * the order with a revision-checked patch and any other caller backs off.
 * Never throws — a failure is written onto the order for the retry cron and
 * for whoever looks at it in admin.
 */
export async function sendOrderToShiprocket(orderDocId: string) {
  if (!isShiprocketConfigured() || !writeClient) return;
  const order = await writeClient.fetch<OrderDoc | null>(`*[_id == $id][0]{${ORDER_FIELDS}}`, { id: orderDocId });
  if (!order || order.shiprocketOrderId || order.paymentStatus === "failed") return;
  if (order.shiprocketSyncStatus === "sent") return;
  const startedAt = order.shiprocketSyncStartedAt ? Date.parse(order.shiprocketSyncStartedAt) : 0;
  if (order.shiprocketSyncStatus === "sending" && Date.now() - startedAt < STALE_SENDING_MS) return;

  try {
    await writeClient
      .patch(order._id)
      .ifRevisionId(order._rev)
      .set({ shiprocketSyncStatus: "sending", shiprocketSyncStartedAt: new Date().toISOString() })
      .commit();
  } catch {
    return; // Someone else changed the order first — they own this attempt.
  }

  try {
    const result = await shiprocketRequest<{ order_id?: number; shipment_id?: number; status?: string }>(
      "/orders/create/adhoc",
      buildPayload(order),
    );
    await writeClient
      .patch(order._id)
      .set({
        shiprocketSyncStatus: "sent",
        shiprocketOrderId: result.order_id ? String(result.order_id) : undefined,
        shiprocketShipmentId: result.shipment_id ? String(result.shipment_id) : undefined,
        shiprocketStatus: result.status ?? "NEW",
      })
      .unset(["shiprocketError"])
      .commit();
  } catch (error) {
    console.error("sendOrderToShiprocket failed:", order.orderNumber, error);
    await writeClient
      .patch(order._id)
      .set({ shiprocketSyncStatus: "failed", shiprocketError: error instanceof Error ? error.message.slice(0, 500) : "Unknown error" })
      .commit()
      .catch(() => undefined);
  }
}

/** Orders that never reached Shiprocket (failed, or stuck mid-send), oldest first. */
export async function findUnsentOrderIds(limit: number) {
  if (!writeClient) return [];
  const staleBefore = new Date(Date.now() - STALE_SENDING_MS).toISOString();
  return writeClient.fetch<string[]>(
    `*[_type == "order" && paymentStatus != "failed" && !defined(shiprocketOrderId)
      && (shiprocketSyncStatus == "failed" || (shiprocketSyncStatus == "sending" && shiprocketSyncStartedAt < $staleBefore))
    ] | order(_createdAt asc)[0...$limit]._id`,
    { staleBefore, limit },
  );
}

/** Re-sends up to `limit` orders that never reached Shiprocket. Returns how many were tried. */
export async function retryUnsentOrders(limit: number) {
  if (!isShiprocketConfigured()) return 0;
  const ids = await findUnsentOrderIds(limit);
  for (const id of ids) await sendOrderToShiprocket(id);
  return ids.length;
}

// ── Tracking updates ────────────────────────────────────────────────────

export type FulfillmentStatus = "Unfulfilled" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Returned";

/** Maps Shiprocket's shipment status text to the order's fulfillment step. */
export function fulfillmentFromShiprocket(status: string): FulfillmentStatus | null {
  const s = status.toUpperCase();
  if (s.startsWith("RTO") || s.includes("RETURN")) return "Returned";
  if (s.includes("CANCEL") || s === "LOST" || s === "DESTROYED" || s === "DAMAGED") return "Cancelled";
  if (s === "DELIVERED") return "Delivered";
  if (/PICKED UP|SHIPPED|IN TRANSIT|OUT FOR DELIVERY|REACHED|DESTINATION|UNDELIVERED|DELAYED|MISROUTED|CUSTODY/.test(s)) return "Shipped";
  if (/AWB|PICKUP|MANIFEST|LABEL|READY TO SHIP|PACKED|INVOICED/.test(s)) return "Processing";
  return null;
}

export const trackingUrlFor = (awb: string) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;

export interface CourierUpdate {
  awb?: string | number;
  courier_name?: string;
  current_status?: string;
  shipment_status?: string;
  order_id?: string | number;
  sr_order_id?: string | number;
  etd?: string;
  current_timestamp?: string;
}

interface ShipmentStatus {
  status?: string;
  awb?: string;
  courierName?: string;
  etd?: string;
}

/** Writes a shipment status onto the order, only touching fields that changed. */
async function applyShipmentStatus(id: string, current: Record<string, unknown>, next: ShipmentStatus) {
  if (!writeClient) return;
  const fulfillment = next.status ? fulfillmentFromShiprocket(next.status) : null;
  const changes: Record<string, string> = {
    ...(next.status && { shiprocketStatus: next.status }),
    ...(fulfillment && { fulfillmentStatus: fulfillment }),
    ...(next.awb && { awbCode: next.awb, trackingUrl: trackingUrlFor(next.awb) }),
    ...(next.courierName && { courierName: next.courierName }),
    ...(next.etd && { estimatedDelivery: next.etd }),
  };
  const changed = Object.fromEntries(Object.entries(changes).filter(([key, value]) => current[key] !== value));
  await writeClient
    .patch(id)
    .set({
      ...changed,
      lastShiprocketCheckAt: new Date().toISOString(),
      ...(Object.keys(changed).length && { lastTrackingUpdateAt: new Date().toISOString() }),
    })
    .commit();
  // A cancellation in Shiprocket puts the items back on the shelf.
  if (changed.fulfillmentStatus === "Cancelled") await restoreStockForOrder(id);
}

const TRACKED_FIELDS = "_id, shiprocketOrderId, shiprocketStatus, fulfillmentStatus, awbCode, trackingUrl, courierName, estimatedDelivery";

/** Applies a Shiprocket tracking webhook to the matching order. Returns whether one matched. */
export async function applyCourierUpdate(update: CourierUpdate) {
  if (!writeClient) return false;
  const srOrderId = update.sr_order_id ? String(update.sr_order_id) : "";
  const orderNumber = update.order_id ? String(update.order_id) : "";
  const order = await writeClient.fetch<Record<string, unknown> & { _id: string } | null>(
    `*[_type == "order" && (($srOrderId != "" && shiprocketOrderId == $srOrderId) || orderNumber == $orderNumber)][0]{${TRACKED_FIELDS}}`,
    { srOrderId, orderNumber },
  );
  if (!order) return false;
  await applyShipmentStatus(order._id, order, {
    status: update.current_status || update.shipment_status,
    awb: update.awb ? String(update.awb) : undefined,
    courierName: update.courier_name,
    etd: update.etd,
  });
  return true;
}

// ── Status checks ───────────────────────────────────────────────────────
// The webhook only fires once a shipment has an AWB, so an order cancelled
// (or edited) in Shiprocket before that never reports back. These ask
// Shiprocket directly for orders that aren't finished yet.

const FINISHED = ["Delivered", "Cancelled", "Returned"];
/** Don't ask Shiprocket about the same order more often than this. */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

interface ShiprocketOrderDetails {
  data?: {
    status?: string;
    courier_name?: string;
    etd?: string;
    awb_data?: { awb?: string | number; courier_name?: string; etd?: string };
    shipments?: { status?: string; awb?: string | number; courier?: string; etd?: string };
  };
}

async function checkOrder(order: Record<string, unknown> & { _id: string; shiprocketOrderId: string }) {
  try {
    const { data } = await shiprocketRequest<ShiprocketOrderDetails>(`/orders/show/${encodeURIComponent(order.shiprocketOrderId)}`);
    if (!data) return;
    const awb = data.awb_data?.awb || data.shipments?.awb;
    await applyShipmentStatus(order._id, order, {
      status: data.shipments?.status || data.status,
      awb: awb ? String(awb) : undefined,
      courierName: data.awb_data?.courier_name || data.shipments?.courier || data.courier_name,
      etd: data.awb_data?.etd || data.shipments?.etd || data.etd,
    });
  } catch (error) {
    console.error("Shiprocket status check failed:", order.shiprocketOrderId, error);
  }
}

/**
 * Refreshes unfinished orders from Shiprocket — all of them (cron) or one
 * customer's (My Orders page). Never throws; a slow or failing Shiprocket
 * just leaves the last known status in place.
 */
export async function syncOpenOrders({ customerId, limit }: { customerId?: string; limit: number }) {
  if (!isShiprocketConfigured() || !writeClient) return;
  const checkedBefore = new Date(Date.now() - CHECK_INTERVAL_MS).toISOString();
  const orders = await writeClient.fetch<Array<Record<string, unknown> & { _id: string; shiprocketOrderId: string }>>(
    `*[_type == "order" && defined(shiprocketOrderId) && !(fulfillmentStatus in $finished)
      && (!defined($customerId) || customer._ref == $customerId)
      && (!defined(lastShiprocketCheckAt) || lastShiprocketCheckAt < $checkedBefore)
    ] | order(_createdAt desc)[0...$limit]{${TRACKED_FIELDS}}`,
    { finished: FINISHED, customerId: customerId ?? null, checkedBefore, limit },
  ).catch(() => []);
  await Promise.all(orders.map(checkOrder));
}
