import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { signPayload, verifyPayload, sha256Hex, timingSafeStringEqual } from "./crypto";

const CHALLENGE_COOKIE = "leyros_otp_challenge";
const CHALLENGE_TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;

interface OtpChallengePayload {
  phone: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  nonce: string;
}

function getSecret(): string {
  const secret = process.env.OTP_SIGNING_SECRET;
  if (!secret) throw new Error("OTP_SIGNING_SECRET is not configured");
  return secret;
}

function hashCode(phone: string, code: string): string {
  return sha256Hex(`${phone}:${code}:${process.env.OTP_HASH_PEPPER ?? ""}`);
}

function challengeCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge: maxAgeSeconds,
  };
}

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/** Generates a fresh code, stores its hash in a signed challenge cookie, and returns the code to send. */
export async function issueOtpChallenge(phone: string): Promise<string> {
  const code = generateOtpCode();
  const payload: OtpChallengePayload = {
    phone,
    codeHash: hashCode(phone, code),
    expiresAt: Date.now() + CHALLENGE_TTL_SECONDS * 1000,
    attempts: 0,
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  const token = signPayload(payload, getSecret());
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, token, challengeCookieOptions(CHALLENGE_TTL_SECONDS));
  return code;
}

export type OtpVerifyResult =
  | { ok: true; phone: string }
  | { ok: false; reason: "no-challenge" | "expired" | "phone-mismatch" | "too-many-attempts" | "incorrect-code" };

/**
 * Verifies `code` against the signed challenge cookie. `expectedPhone` (from
 * the request body) is checked only as defense in depth — the phone actually
 * used to look up/create the customer must come from the returned `phone`
 * field (sourced from the signed cookie), never from the request body
 * directly, so a valid challenge for one phone can't be laundered against a
 * different claimed phone.
 */
export async function verifyOtpChallenge(code: string, expectedPhone: string): Promise<OtpVerifyResult> {
  const store = await cookies();
  const token = store.get(CHALLENGE_COOKIE)?.value;
  const payload = verifyPayload<OtpChallengePayload>(token, getSecret());

  if (!payload) return { ok: false, reason: "no-challenge" };
  if (payload.phone !== expectedPhone) return { ok: false, reason: "phone-mismatch" };

  if (Date.now() > payload.expiresAt) {
    store.delete(CHALLENGE_COOKIE);
    return { ok: false, reason: "expired" };
  }
  if (payload.attempts >= MAX_ATTEMPTS) {
    store.delete(CHALLENGE_COOKIE);
    return { ok: false, reason: "too-many-attempts" };
  }

  const providedHash = hashCode(payload.phone, code);
  if (!timingSafeStringEqual(providedHash, payload.codeHash)) {
    const remainingTtlSeconds = Math.max(1, Math.ceil((payload.expiresAt - Date.now()) / 1000));
    const nextPayload: OtpChallengePayload = { ...payload, attempts: payload.attempts + 1 };
    store.set(CHALLENGE_COOKIE, signPayload(nextPayload, getSecret()), challengeCookieOptions(remainingTtlSeconds));
    return { ok: false, reason: "incorrect-code" };
  }

  store.delete(CHALLENGE_COOKIE);
  return { ok: true, phone: payload.phone };
}
