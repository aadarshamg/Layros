import { NextRequest, NextResponse } from "next/server";
import { isValidInvoiceSignature } from "@/lib/invoices/link";
import { buildInvoice, InvoiceUnavailableError } from "@/lib/invoices/invoice";
import { renderInvoicePdf } from "@/lib/invoices/pdf";

export const dynamic = "force-dynamic";

// GST tax invoice PDF for one order, opened from My Orders or from the order
// in admin. The link is signed per order (lib/invoices/link.ts).
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!isValidInvoiceSignature(orderId, request.nextUrl.searchParams.get("sig"))) {
    return NextResponse.json({ error: "This invoice link isn't valid." }, { status: 403 });
  }

  try {
    const invoice = await buildInvoice(orderId);
    const pdf = await renderInvoicePdf(invoice);
    const filename = `Leyros-Invoice-${invoice.invoiceNumber.replace(/\//g, "-")}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        // inline: opens in the browser's PDF viewer, which has its own download button.
        "Content-Disposition": `${request.nextUrl.searchParams.get("download") ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof InvoiceUnavailableError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Invoice failed:", orderId, error);
    return NextResponse.json({ error: "Could not create the invoice. Please try again." }, { status: 500 });
  }
}
