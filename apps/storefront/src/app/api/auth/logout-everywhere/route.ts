import { NextResponse } from "next/server";
import { getSessionCustomerId, destroySession } from "@/lib/auth/session";
import { bumpTokenVersion } from "@/lib/auth/customers";

export async function POST() {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  await bumpTokenVersion(customerId);
  await destroySession();
  return NextResponse.json({ loggedOut: true });
}
