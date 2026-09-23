import { NextRequest, NextResponse } from "next/server";
import { requestOtpSchema } from "@/lib/validation/auth";
import { issueOtpChallenge } from "@/lib/auth/otp";
import { checkOtpRateLimit, hashIp } from "@/lib/auth/rate-limit";
import { sendOtp } from "@/lib/auth/otp-senders";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid phone number." }, { status: 400 });
  }
  const { phone } = parsed.data;

  const rateLimit = await checkOtpRateLimit(phone, hashIp(getClientIp(request)));
  if (!rateLimit.allowed) {
    const message =
      rateLimit.reason === "too-frequent"
        ? "Please wait a minute before requesting another code."
        : "Too many codes requested. Please try again later.";
    return NextResponse.json({ error: message }, { status: 429 });
  }

  const code = await issueOtpChallenge(phone);
  const result = await sendOtp(phone, code);

  if (!result.ok) {
    return NextResponse.json({ error: "Could not send the code. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
