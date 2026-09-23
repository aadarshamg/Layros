import "server-only";
import crypto from "node:crypto";

/**
 * Shared HMAC sign/verify helpers for both the OTP challenge cookie and the
 * session cookie (lib/auth/otp.ts, lib/auth/session.ts) — each caller passes
 * its own secret, so a leaked/guessed OTP secret can't be used to forge a
 * session, and vice versa.
 */

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/** Signs a JSON-serializable payload as `base64url(json).base64url(hmac)`. */
export function signPayload(payload: unknown, secret: string): string {
  const json = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(json);
  const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest();
  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

/**
 * Verifies and decodes a token produced by signPayload. Returns null on any
 * failure (malformed, wrong secret, tampered) — never throws, since a
 * forged/expired cookie is an expected, routine case, not an error.
 */
export function verifyPayload<T>(token: string | undefined | null, secret: string): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;

  const expectedSignature = crypto.createHmac("sha256", secret).update(encodedPayload).digest();
  const providedSignature = base64UrlDecode(encodedSignature);
  if (expectedSignature.length !== providedSignature.length) return null;
  if (!crypto.timingSafeEqual(expectedSignature, providedSignature)) return null;

  try {
    return JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Timing-safe comparison of two hex/base64 strings of potentially different length. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
