import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/data/store-settings";

// Powers the cart drawer's reward banner (off by default until an admin
// turns it on in Sanity) and any other client component that needs the
// site-wide settings without a server-rendered parent to pass them down.
export async function GET() {
  return NextResponse.json(await getStoreSettings());
}
