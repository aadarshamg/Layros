import { NextRequest, NextResponse } from "next/server";
import { timingSafeStringEqual } from "@/lib/auth/crypto";
import { isShiprocketConfigured, retryUnsentOrders } from "@/lib/shipping/shiprocket";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 20;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return timingSafeStringEqual(header, `Bearer ${secret}`);
}

// Re-sends orders that never reached Shiprocket (it was down, or the address
// was rejected and has since been fixed in admin). Vercel Cron calls it daily
// (see vercel.json; Hobby plans allow no more often), and every new order
// also retries a few in lib/checkout/orders.ts, so busy days catch up sooner.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isShiprocketConfigured()) return NextResponse.json({ skipped: "Shiprocket is not configured." });
  return NextResponse.json({ retried: await retryUnsentOrders(MAX_PER_RUN) });
}
