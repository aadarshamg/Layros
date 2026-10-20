import "server-only";
import crypto from "node:crypto";
import { timingSafeStringEqual } from "@/lib/auth/crypto";

// Invoice links are signed per order, so the same link works for the
// customer (My Orders) and for admin (the order's "Invoice" field) without a
// login — like a Shopify order-status link, only someone given it can open it.

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function signature(orderDocId: string) {
  const secret = process.env.INVOICE_LINK_SECRET;
  if (!secret) throw new Error("INVOICE_LINK_SECRET is not configured.");
  return crypto.createHmac("sha256", secret).update(`invoice:${orderDocId}`).digest("base64url").slice(0, 32);
}

export const isInvoiceLinkConfigured = () => Boolean(process.env.INVOICE_LINK_SECRET);

export function invoiceLinkFor(orderDocId: string) {
  return `${siteUrl}/api/invoices/${encodeURIComponent(orderDocId)}?sig=${signature(orderDocId)}`;
}

export function isValidInvoiceSignature(orderDocId: string, sig: string | null) {
  return Boolean(sig && isInvoiceLinkConfigured() && timingSafeStringEqual(sig, signature(orderDocId)));
}
