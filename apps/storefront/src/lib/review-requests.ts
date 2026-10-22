import "server-only";
import { createClient } from "next-sanity";
import { productNameFromTitle } from "@/lib/product-labels";

/**
 * Asks customers for a product review a few days after delivery, once per
 * order, by WhatsApp through the same WaSarathi / BotSailor panel as the
 * login OTP. In the panel, get a Utility template approved, e.g.
 *
 *   "Hi {{1}}, how are you finding {{2}}? It takes a minute to review it
 *    here: {{3}}"
 *
 * then API Developer → Generate API End-point → "Send Template Message (GET)"
 * and paste the URL into WHATSAPP_REVIEW_REQUEST_ENDPOINT. Its template
 * variables are filled in order: first name, product name, review link; the
 * recipient is set to the order's phone. Without the endpoint nothing is
 * sent or marked, so orders are asked once it is configured.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const writeClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leyros.in").replace(/\/$/, "");

const DAYS_AFTER_DELIVERY = 3;
/** Orders delivered longer ago than this are left alone (no surprise messages weeks later). */
const MAX_DAYS_AFTER_DELIVERY = 14;

interface DueOrder {
  _id: string;
  orderNumber: string;
  customerPhone?: string;
  name?: string;
  product?: { title?: string; handle?: string };
}

function tenDigits(phone?: string) {
  const digits = phone?.replace(/\D/g, "").slice(-10);
  return digits && digits.length === 10 ? digits : "";
}

async function send(order: DueOrder): Promise<boolean> {
  const endpoint = process.env.WHATSAPP_REVIEW_REQUEST_ENDPOINT?.trim();
  const phone = tenDigits(order.customerPhone);
  if (!endpoint || !phone || !order.product?.handle) return false;

  const url = new URL(endpoint);
  const values = [
    (order.name ?? "").trim().split(/\s+/)[0] || "there",
    productNameFromTitle(order.product.title ?? "your Leyros fragrance"),
    `${siteUrl}/products/${order.product.handle}#reviews`,
  ];
  // Variables are named like templateVariable-name-1; fill them in their numbered order.
  [...url.searchParams.keys()]
    .filter((key) => /variable/i.test(key))
    .sort((a, b) => Number(a.match(/(\d+)$/)?.[1] ?? 0) - Number(b.match(/(\d+)$/)?.[1] ?? 0))
    .forEach((key, index) => url.searchParams.set(key, values[index] ?? values[values.length - 1]));
  const recipientKeys = [...url.searchParams.keys()].filter((key) => key === "phone_number" || key === "sendToPhoneNumber");
  for (const key of recipientKeys.length ? recipientKeys : ["phone_number"]) url.searchParams.set(key, `91${phone}`);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const body = (await response.json().catch(() => null)) as { status?: unknown; message?: string } | null;
  // These panels answer 200 even on failure, with e.g. {"status":"0","message":"…"}.
  if (!response.ok || body?.status === 0 || body?.status === "0" || body?.status === false) {
    console.error("Review request failed:", order.orderNumber, body?.message ?? response.status);
    return false;
  }
  return true;
}

/** Sends due review requests (run daily from the cron). Returns how many went out. */
export async function sendDueReviewRequests(limit = 50): Promise<number> {
  if (!writeClient) return 0;
  if (!process.env.WHATSAPP_REVIEW_REQUEST_ENDPOINT?.trim()) {
    console.warn("Review requests skipped: WHATSAPP_REVIEW_REQUEST_ENDPOINT not set.");
    return 0;
  }
  const day = 24 * 60 * 60 * 1000;
  const orders = await writeClient.fetch<DueOrder[]>(
    `*[_type == "order" && fulfillmentStatus == "Delivered" && !defined(reviewRequestSentAt)
      && defined(deliveredAt) && deliveredAt < $dueBefore && deliveredAt > $notBefore]
      | order(deliveredAt asc)[0...$limit]{
        _id, orderNumber, customerPhone, "name": shippingAddress.fullName,
        "product": *[_type == "product" && _id == ^.items[0].productId][0]{title, "handle": slug.current}
      }`,
    {
      dueBefore: new Date(Date.now() - DAYS_AFTER_DELIVERY * day).toISOString(),
      notBefore: new Date(Date.now() - MAX_DAYS_AFTER_DELIVERY * day).toISOString(),
      limit,
    },
  );
  let sent = 0;
  for (const order of orders) {
    try {
      if (await send(order)) {
        await writeClient.patch(order._id).set({ reviewRequestSentAt: new Date().toISOString() }).commit();
        sent++;
      }
    } catch (error) {
      console.error("Review request failed:", order.orderNumber, error);
    }
  }
  return sent;
}
