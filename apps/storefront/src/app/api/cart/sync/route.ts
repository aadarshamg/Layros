import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone } from "@/lib/auth/session";
import { customerIdForPhone } from "@/lib/auth/customers";
import { cartDocId, normalizePhone, recoveryClient, saveCartSnapshot, type IncomingCartLine } from "@/lib/cart-recovery/store";

// Names go into the WhatsApp greeting, so only allow plain name characters.
function safeFirstName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const first = raw.trim().split(/\s+/)[0] ?? "";
  return /^[\p{L}.'-]{1,30}$/u.test(first) ? first : undefined;
}

export async function POST(request: NextRequest) {
  let body: { lines?: IncomingCartLine[]; consent?: boolean; phone?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  if (!recoveryClient) return NextResponse.json({ ok: false });

  const sessionPhone = await getSessionPhone();
  const phone = sessionPhone ?? normalizePhone(body.phone);
  if (!phone) return NextResponse.json({ ok: true, tracked: false });

  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 20) : [];

  if (body.consent !== true) {
    // No consent: never create a record, and switch off messages on an existing one.
    const id = cartDocId(phone);
    const exists = await recoveryClient.fetch<string | null>(`*[_id == $id][0]._id`, { id });
    if (exists) await recoveryClient.patch(id).set({ consent: false }).commit();
    return NextResponse.json({ ok: true, tracked: false });
  }

  let name = safeFirstName(body.name);
  if (sessionPhone) {
    const profileName = await recoveryClient.fetch<string | null>(`*[_id == $id][0].name`, { id: customerIdForPhone(sessionPhone) });
    name = safeFirstName(profileName) ?? name;
  }

  const result = await saveCartSnapshot({ phone, name, consent: true, source: sessionPhone ? "login" : "guest", lines });
  return NextResponse.json({ ok: true, tracked: result.saved });
}
