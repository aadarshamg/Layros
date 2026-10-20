import { NextRequest, NextResponse } from "next/server";
import { timingSafeStringEqual } from "@/lib/auth/crypto";
import { applyCourierUpdate, type CourierUpdate } from "@/lib/shipping/shiprocket";

export const dynamic = "force-dynamic";

// Shiprocket tracking webhook (Settings → API → Webhooks). Shiprocket refuses
// URLs containing "shiprocket", "sr" or "kr", hence the neutral path. It sends
// the configured token as `x-api-key` and expects a 200 for every delivery,
// even ones we can't match, or it keeps retrying.
export async function POST(request: NextRequest) {
  const secret = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (!secret || !timingSafeStringEqual(request.headers.get("x-api-key") ?? "", secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: CourierUpdate;
  try {
    update = await request.json();
  } catch {
    // Shiprocket's "test webhook" button can send an empty body.
    return NextResponse.json({ ok: true });
  }

  try {
    const matched = await applyCourierUpdate(update);
    if (!matched) console.warn("Shiprocket update matched no order:", update.order_id, update.sr_order_id, update.awb);
  } catch (error) {
    console.error("Shiprocket update failed:", update.order_id, error);
  }
  return NextResponse.json({ ok: true });
}
