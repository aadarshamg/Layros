import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { finalizeRazorpayOrder, findRecordedOrderNumber, getCheckoutSession } from "@/lib/checkout/finalize";

export const dynamic = "force-dynamic";

interface RazorpayEvent {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string } };
    order?: { entity?: { id?: string } };
  };
}

function signatureValid(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Razorpay → site, server to server (Dashboard → Settings → Webhooks, events
 * payment.captured + order.paid). Records the order when the shopper's browser
 * never confirmed it — e.g. they closed the tab right after paying. Safe to
 * receive more than once: the order has a fixed id per Razorpay order.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });

  const rawBody = await request.text();
  if (!signatureValid(rawBody, request.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed body" }, { status: 400 });
  }
  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = event.payload?.order?.entity?.id ?? payment?.order_id;
  const razorpayPaymentId = payment?.id;
  if (!razorpayOrderId || !razorpayPaymentId) return NextResponse.json({ ok: true, ignored: "no order/payment id" });

  const existing = await findRecordedOrderNumber(razorpayOrderId);
  if (existing) return NextResponse.json({ ok: true, status: "already recorded", orderNumber: existing });

  const session = await getCheckoutSession(razorpayOrderId);
  if (!session) {
    // Paid, but no cart copy to build the order from — visible in the Razorpay dashboard; needs manual follow-up.
    console.error("Razorpay webhook: paid order with no checkout data", razorpayOrderId, razorpayPaymentId);
    return NextResponse.json({ ok: true, status: "no checkout data" });
  }

  try {
    const { orderNumber, saved } = await finalizeRazorpayOrder({ razorpayOrderId, razorpayPaymentId, session, confirmedBy: "webhook" });
    // A failed save returns 500 so Razorpay retries the webhook later.
    return saved ? NextResponse.json({ ok: true, status: "recorded", orderNumber }) : NextResponse.json({ error: "save failed" }, { status: 500 });
  } catch (error) {
    console.error("Razorpay webhook: finalize failed", razorpayOrderId, error);
    return NextResponse.json({ error: "finalize failed" }, { status: 500 });
  }
}
