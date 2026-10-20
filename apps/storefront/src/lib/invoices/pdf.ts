import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Invoice } from "@/lib/invoices/invoice";

// Draws an A4 tax invoice. pdf-lib's built-in Helvetica only covers Latin-1,
// so text is cleaned first and amounts use "Rs." rather than the rupee sign.

const GREEN = rgb(0.102, 0.259, 0.184); // #1a422f, the site's green
const GREY = rgb(0.31, 0.39, 0.33);
const LINE = rgb(0.85, 0.87, 0.85);
const PAGE = { width: 595.28, height: 841.89, margin: 40 };

const clean = (text: string) =>
  text.replace(/₹/g, "Rs.").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/[^\x20-\x7E -ÿ]/g, "");

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const restWords = rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ` ${ONES[rest % 10]}` : ""}`;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", restWords].filter(Boolean).join(" ");
}

/** 1,23,456 -> "One Lakh Twenty Three Thousand Four Hundred Fifty Six", Indian grouping. */
function inWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1e3;
  if (crore) parts.push(`${inWords(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

function amountInWords(amount: number) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  return `Rupees ${inWords(rupees)}${paise ? ` and ${inWords(paise)} Paise` : ""} Only`;
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of clean(text).split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width || !current) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderInvoicePdf(invoice: Invoice) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tax Invoice ${invoice.invoiceNumber}`);
  pdf.setAuthor(invoice.seller.legalName);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;
  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;

  const text = (value: string, x: number, size = 9, font = regular, color = GREY) =>
    page.drawText(clean(value), { x, y, size, font, color });
  const textRight = (value: string, x: number, size = 9, font = regular, color = GREY) =>
    page.drawText(clean(value), { x: x - font.widthOfTextAtSize(clean(value), size), y, size, font, color });
  const rule = (thickness = 0.6, color = LINE) => page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness, color });

  // ── Header: seller on the left, title and numbers on the right
  text(invoice.seller.legalName, left, 16, bold, GREEN);
  textRight("TAX INVOICE", right, 16, bold, GREEN);
  y -= 16;
  const sellerLines = [
    ...invoice.seller.address,
    invoice.seller.gstin ? `GSTIN: ${invoice.seller.gstin}` : "GSTIN: not set (Store Settings > Invoice / GST)",
    `State: ${invoice.seller.state}`,
    [invoice.seller.phone, invoice.seller.email].filter(Boolean).join("  |  "),
  ].filter(Boolean);
  const metaLines: [string, string][] = [
    ["Invoice no.", invoice.invoiceNumber],
    ["Invoice date", new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })],
    ["Order no.", invoice.orderNumber],
    ["Payment", invoice.paymentLabel],
    ["Place of supply", invoice.buyer.state || "-"],
  ];
  const headerRows = Math.max(sellerLines.length, metaLines.length);
  for (let row = 0; row < headerRows; row++) {
    if (sellerLines[row]) text(sellerLines[row], left, 9);
    if (metaLines[row]) {
      textRight(metaLines[row][1], right, 9, bold, GREEN);
      textRight(`${metaLines[row][0]}:  `, right - bold.widthOfTextAtSize(clean(metaLines[row][1]), 9), 9);
    }
    y -= 12;
  }
  y -= 6;
  rule(1.2, GREEN);
  y -= 18;

  // ── Billed / shipped to (same address: the site has one address per order)
  text("BILL TO / SHIP TO", left, 8, bold, GREEN);
  y -= 13;
  text(invoice.buyer.name, left, 10, bold, GREEN);
  y -= 12;
  for (const line of [...invoice.buyer.address, [invoice.buyer.phone && `Phone: ${invoice.buyer.phone}`, invoice.buyer.email].filter(Boolean).join("  |  ")]) {
    if (!line) continue;
    text(line, left, 9);
    y -= 12;
  }
  y -= 10;

  // ── Line items
  const taxColumns: [string, keyof Invoice["lines"][number]][] = invoice.intraState
    ? [[`CGST ${invoice.gstRate / 2}%`, "cgst"], [`SGST ${invoice.gstRate / 2}%`, "sgst"]]
    : [[`IGST ${invoice.gstRate}%`, "igst"]];
  // Right edges of the numeric columns, from the right margin inwards.
  const amountX = right;
  const taxXs = taxColumns.map((_, index) => amountX - 70 - (taxColumns.length - 1 - index) * 62);
  const taxableX = (taxXs[0] ?? amountX - 70) - 62;
  const qtyX = taxableX - 62;
  const hsnX = qtyX - 52;
  const descX = left + 18;
  const descWidth = hsnX - 8 - descX;

  const header = () => {
    page.drawRectangle({ x: left, y: y - 6, width: right - left, height: 20, color: rgb(0.95, 0.96, 0.95) });
    y += 1;
    text("#", left + 4, 8, bold, GREEN);
    text("Item", descX, 8, bold, GREEN);
    text("HSN", hsnX, 8, bold, GREEN);
    textRight("Qty", qtyX, 8, bold, GREEN);
    textRight("Taxable value", taxableX, 8, bold, GREEN);
    taxColumns.forEach(([label], index) => textRight(label, taxXs[index], 8, bold, GREEN));
    textRight("Amount", amountX, 8, bold, GREEN);
    y -= 22;
  };
  header();

  invoice.lines.forEach((line, index) => {
    const descLines = wrap(line.description, regular, 9, descWidth);
    const height = descLines.length * 11 + 8;
    if (y - height < PAGE.margin + 160) {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
      header();
    }
    text(String(index + 1), left + 4);
    descLines.forEach((descLine, lineIndex) => page.drawText(descLine, { x: descX, y: y - lineIndex * 11, size: 9, font: regular, color: GREEN }));
    text(line.hsn, hsnX);
    textRight(String(line.quantity), qtyX);
    textRight(money(line.taxableValue), taxableX);
    taxColumns.forEach(([, key], index) => textRight(money(line[key] as number), taxXs[index]));
    textRight(money(line.amount), amountX, 9, bold, GREEN);
    y -= height;
    rule();
    y -= 12;
  });

  // ── Totals
  const totalRows: [string, number][] = [
    ["Taxable value", invoice.totals.taxableValue],
    ...(invoice.intraState
      ? ([[`CGST @ ${invoice.gstRate / 2}%`, invoice.totals.cgst], [`SGST @ ${invoice.gstRate / 2}%`, invoice.totals.sgst]] as [string, number][])
      : ([[`IGST @ ${invoice.gstRate}%`, invoice.totals.igst]] as [string, number][])),
    ...(invoice.totals.roundOff ? ([["Round off", invoice.totals.roundOff]] as [string, number][]) : []),
  ];
  for (const [label, value] of totalRows) {
    textRight(label, right - 110);
    textRight(money(value), right);
    y -= 13;
  }
  y -= 2;
  page.drawLine({ start: { x: right - 220, y: y + 8 }, end: { x: right, y: y + 8 }, thickness: 0.8, color: GREEN });
  y -= 6;
  textRight("Total (incl. GST)", right - 110, 11, bold, GREEN);
  textRight(`Rs. ${money(invoice.totals.grandTotal)}`, right, 11, bold, GREEN);
  y -= 18;
  for (const line of wrap(amountInWords(invoice.totals.grandTotal), regular, 9, right - left)) {
    text(line, left, 9, regular, GREEN);
    y -= 12;
  }

  // ── Footer
  y = Math.min(y - 24, PAGE.margin + 70);
  rule();
  y -= 14;
  const footer = [
    "Prices include GST. Tax is not payable on reverse charge basis.",
    ...(invoice.seller.footerNote ? wrap(invoice.seller.footerNote, regular, 8, right - left) : []),
    "This is a computer-generated invoice and does not need a signature.",
  ];
  for (const line of footer) {
    text(line, left, 8);
    y -= 11;
  }

  return pdf.save();
}
