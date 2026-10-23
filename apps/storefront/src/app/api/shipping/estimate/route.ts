import { NextRequest, NextResponse } from "next/server";
import { deliveryEstimate } from "@/lib/shipping/shiprocket";

// Product page PIN check: can we deliver there, and roughly when?
export async function GET(request: NextRequest) {
  const pin = request.nextUrl.searchParams.get("pin") ?? "";
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ error: "Enter a valid 6-digit PIN code." }, { status: 400 });
  try {
    return NextResponse.json(await deliveryEstimate(pin));
  } catch (error) {
    console.error("Delivery estimate failed:", pin, error);
    return NextResponse.json({ error: "Couldn't check that PIN right now. Please try again." }, { status: 502 });
  }
}
