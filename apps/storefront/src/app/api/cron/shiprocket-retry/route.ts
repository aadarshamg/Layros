import { NextRequest, NextResponse } from "next/server";
import { timingSafeStringEqual } from "@/lib/auth/crypto";
import { findUnsentOrderIds, isShiprocketConfigured, sendOrderToShiprocket } from "@/lib/shipping/shiprocket";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 20;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return timingSafeStringEqual(header, `Bearer ${secret}`);
}

// Re-sends orders that never reached Shiprocket (it was down, or the address
// was rejected and has since been fixed in admin). Call it from the same
// scheduler as /api/cron/abandoned-carts, e.g. every 30 minutes.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isShiprocketConfigured()) return NextResponse.json({ skipped: "Shiprocket is not configured." });

  const ids = await findUnsentOrderIds(MAX_PER_RUN);
  for (const id of ids) await sendOrderToShiprocket(id);
  return NextResponse.json({ retried: ids.length });
}
