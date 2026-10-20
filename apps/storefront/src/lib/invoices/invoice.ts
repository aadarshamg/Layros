import "server-only";
import { createClient } from "next-sanity";

// Builds GST tax invoices from saved orders. Prices on the site include GST,
// so each line's GST is carved out of what the shopper paid for it.

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const writeClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;

export interface InvoiceSeller {
  legalName: string;
  gstin?: string;
  address: string[];
  state: string;
  email?: string;
  phone?: string;
  footerNote?: string;
}

export interface InvoiceLine {
  description: string;
  hsn: string;
  quantity: number;
  /** What the shopper paid for the line after its share of discounts, GST included. */
  amount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  paymentLabel: string;
  seller: InvoiceSeller;
  buyer: { name: string; address: string[]; phone?: string; email?: string; state: string };
  intraState: boolean;
  gstRate: number;
  lines: InvoiceLine[];
  totals: { taxableValue: number; cgst: number; sgst: number; igst: number; roundOff: number; grandTotal: number };
}

interface OrderDoc {
  _id: string;
  _createdAt: string;
  orderNumber: string;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "paid" | "pending" | "failed";
  fulfillmentStatus?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: { fullName?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string };
  items?: { title?: string; sizeLabel?: string; unitPrice?: number; quantity?: number }[];
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  invoiceNumber?: string;
}

interface SettingsDoc {
  invoiceLegalName?: string;
  invoiceGstin?: string;
  invoiceAddress?: string;
  invoiceState?: string;
  invoiceGstRate?: number;
  invoiceFooterNote?: string;
  contactEmail?: string;
  contactPhone?: string;
  brandAddress?: string;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const normalizeState = (state?: string) => (state ?? "").toLowerCase().replace(/[^a-z]/g, "");

/** HSN by product type; 3303 (perfumes, attars) unless the title says otherwise. */
function hsnFor(title: string) {
  const text = title.toLowerCase();
  if (/candle|wax/.test(text)) return "3406";
  if (/car[ -]?(perfume|fragrance)|room|diffuser|air freshener/.test(text)) return "3307";
  return "3303";
}

/** Indian financial year (April–March) for a date, e.g. "2026-27". */
function financialYear(iso: string) {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" })
    .format(new Date(iso))
    .split("-")
    .map(Number);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * Gives the order its invoice number on first request: LEY/2026-27/0001,
 * counting up per financial year. The counter increment is atomic, so two
 * orders can never share a number.
 */
async function ensureInvoiceNumber(order: OrderDoc) {
  if (order.invoiceNumber) return order.invoiceNumber;
  if (!writeClient) throw new Error("SANITY_API_TOKEN is not configured.");
  const fy = financialYear(order._createdAt);
  const counterId = `invoiceCounter-${fy}`;
  await writeClient.createIfNotExists({ _id: counterId, _type: "invoiceCounter", financialYear: fy, last: 0 });
  const counter = await writeClient.patch(counterId).inc({ last: 1 }).commit<{ last: number }>();
  const candidate = `LEY/${fy}/${String(counter.last).padStart(4, "0")}`;
  // setIfMissing: if a parallel request numbered it first, keep theirs.
  const saved = await writeClient
    .patch(order._id)
    .setIfMissing({ invoiceNumber: candidate, invoiceIssuedAt: new Date().toISOString() })
    .commit<{ invoiceNumber: string }>();
  return saved.invoiceNumber;
}

export class InvoiceUnavailableError extends Error {}

export async function buildInvoice(orderDocId: string): Promise<Invoice> {
  if (!writeClient) throw new Error("SANITY_API_TOKEN is not configured.");
  const [order, settings] = await Promise.all([
    writeClient.fetch<OrderDoc | null>(`*[_type == "order" && _id == $id][0]`, { id: orderDocId }),
    writeClient.fetch<SettingsDoc | null>(`*[_id == "storeSettings"][0]`),
  ]);
  if (!order) throw new InvoiceUnavailableError("Order not found.");
  if (order.paymentStatus === "failed") throw new InvoiceUnavailableError("This order's payment didn't go through, so there's no invoice.");
  if (order.fulfillmentStatus === "Cancelled" && !order.invoiceNumber) {
    throw new InvoiceUnavailableError("This order was cancelled, so there's no invoice.");
  }

  const invoiceNumber = await ensureInvoiceNumber(order);
  const gstRate = settings?.invoiceGstRate ?? 18;
  const sellerState = settings?.invoiceState || "Punjab";
  const address = order.shippingAddress ?? {};
  const intraState = normalizeState(address.state) === normalizeState(sellerState);

  const items = (order.items ?? []).filter((item) => (item.quantity ?? 0) > 0);
  const gross = items.map((item) => (item.unitPrice ?? 0) * (item.quantity ?? 0));
  const subtotal = gross.reduce((sum, value) => sum + value, 0);
  const discount = Math.min(order.discountAmount ?? 0, subtotal);
  // The order keeps subtotal, discount and total; the rest is the shipping fee.
  const shipping = Math.max(0, round2(order.totalAmount - subtotal + discount));

  const split = (amount: number) => {
    const taxableValue = round2(amount / (1 + gstRate / 100));
    const tax = round2(amount - taxableValue);
    const half = round2(tax / 2);
    return intraState ? { taxableValue, cgst: half, sgst: round2(tax - half), igst: 0 } : { taxableValue, cgst: 0, sgst: 0, igst: tax };
  };

  // Discounts (coupon + Buy 2 Get 1) are spread across lines by value.
  let discountLeft = discount;
  const lines: InvoiceLine[] = items.map((item, index) => {
    const share = index === items.length - 1 ? discountLeft : round2(subtotal ? (discount * gross[index]) / subtotal : 0);
    discountLeft = round2(discountLeft - share);
    const amount = round2(gross[index] - share);
    const name = (item.title ?? "Item").split("|")[0].trim();
    return {
      description: item.sizeLabel ? `${name} (${item.sizeLabel})` : name,
      hsn: hsnFor(item.title ?? ""),
      quantity: item.quantity ?? 0,
      amount,
      ...split(amount),
    };
  });
  if (shipping > 0) {
    lines.push({ description: "Shipping charges", hsn: "996812", quantity: 1, amount: shipping, ...split(shipping) });
  }

  const sum = (key: "taxableValue" | "cgst" | "sgst" | "igst") => round2(lines.reduce((total, line) => total + line[key], 0));
  const totals = { taxableValue: sum("taxableValue"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst") };
  const lineTotal = round2(totals.taxableValue + totals.cgst + totals.sgst + totals.igst);

  return {
    invoiceNumber,
    invoiceDate: order._createdAt,
    orderNumber: order.orderNumber,
    paymentLabel: order.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)",
    seller: {
      legalName: settings?.invoiceLegalName || "Leyros",
      gstin: settings?.invoiceGstin,
      // The invoice address is entered one line per row; the brand address
      // fallback is a single comma-separated line.
      address: (settings?.invoiceAddress ? settings.invoiceAddress.split(/\r?\n/) : (settings?.brandAddress ?? "").split(/,\s*/))
        .map((line) => line.trim())
        .filter(Boolean),
      state: sellerState,
      email: settings?.contactEmail,
      phone: settings?.contactPhone,
      footerNote: settings?.invoiceFooterNote,
    },
    buyer: {
      name: address.fullName || "Customer",
      address: [
        address.addressLine1,
        address.addressLine2,
        [address.city, address.state].filter(Boolean).join(", ") + (address.postalCode ? ` - ${address.postalCode}` : ""),
      ].filter((line): line is string => Boolean(line?.trim())),
      phone: order.customerPhone,
      email: order.customerEmail,
      state: address.state || "",
    },
    intraState,
    gstRate,
    lines,
    totals: { ...totals, roundOff: round2(order.totalAmount - lineTotal), grandTotal: order.totalAmount },
  };
}
