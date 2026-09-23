import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { verifyOtpChallenge } from "@/lib/auth/otp";
import { findOrCreateCustomerByPhone, updateLastLogin } from "@/lib/auth/customers";
import { createSession } from "@/lib/auth/session";

const ERROR_MESSAGES: Record<string, string> = {
  "no-challenge": "That code has expired. Please request a new one.",
  expired: "That code has expired. Please request a new one.",
  "phone-mismatch": "That code doesn't match this phone number.",
  "too-many-attempts": "Too many incorrect attempts. Please request a new code.",
  "incorrect-code": "That code is incorrect.",
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const result = await verifyOtpChallenge(parsed.data.code, parsed.data.phone);
  if (!result.ok) {
    return NextResponse.json({ error: ERROR_MESSAGES[result.reason] ?? "Verification failed." }, { status: 400 });
  }

  // Authoritative phone comes from the verified challenge, not the request body.
  const { customerId, tokenVersion, isNewCustomer } = await findOrCreateCustomerByPhone(result.phone);
  await createSession(customerId, result.phone, tokenVersion);
  if (!isNewCustomer) await updateLastLogin(customerId);

  return NextResponse.json({
    verified: true,
    isNewCustomer,
    customer: { id: customerId, phone: result.phone },
  });
}
