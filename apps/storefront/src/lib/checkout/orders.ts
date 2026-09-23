import "server-only";
import { createClient } from "next-sanity";
import type { PricedItem } from "@/lib/checkout/pricing";
import type { CheckoutDetailsFormData } from "@leyros/types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

const writeClient =
  projectId && token
    ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false })
    : null;

export function generateOrderNumber(): string {
  // Short, human-readable, and sortable-ish — not a formal invoice sequence,
  // just something a customer/support agent can say out loud.
  return `LEY-${Date.now().toString(36).toUpperCase()}`;
}

export interface SaveOrderInput {
  orderNumber: string;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "paid" | "pending" | "failed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  details: CheckoutDetailsFormData;
  items: PricedItem[];
  subtotalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  totalAmount: number;
  /** Set only when the order was placed while logged in — derived server-side from the session cookie, never trust a client-submitted id. */
  customerId?: string;
}

/**
 * Writes the order to Sanity so it's actually recoverable later — COD
 * orders in particular have no payment-gateway record at all, so without
 * this there'd be no way to know what to ship. Returns whether the write
 * succeeded: for a Razorpay order the payment itself is already the source
 * of truth (Razorpay's own dashboard has it), so callers can log-and-continue
 * on failure; for COD this is the *only* record, so callers should treat a
 * false return as a real failure and not tell the customer their order is placed.
 */
export async function saveOrder(input: SaveOrderInput): Promise<boolean> {
  if (!writeClient) {
    console.error("Cannot save order — SANITY_API_TOKEN is not configured.", input.orderNumber);
    return false;
  }
  try {
    await writeClient.create({
      _type: "order",
      orderNumber: input.orderNumber,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      fulfillmentStatus: "Unfulfilled",
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      customer: input.customerId ? { _type: "reference", _ref: input.customerId, _weak: true } : undefined,
      customerEmail: input.details.email,
      customerPhone: input.details.phone,
      shippingAddress: input.details.shippingAddress,
      giftWrapMessage: input.details.giftWrap?.enabled ? input.details.giftWrap.message : undefined,
      items: input.items.map((item, index) => ({
        _type: "orderItem",
        _key: `${input.orderNumber}-item-${index}`,
        title: item.title,
        sku: item.sku,
        sizeLabel: item.sizeLabel,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      subtotalAmount: input.subtotalAmount,
      couponCode: input.couponCode,
      discountAmount: input.discountAmount,
      totalAmount: input.totalAmount,
    });
    return true;
  } catch (error) {
    console.error("Failed to save order to Sanity:", input.orderNumber, error);
    return false;
  }
}
