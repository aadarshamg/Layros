import "server-only";
import { createClient } from "next-sanity";
import { sha256Hex } from "./crypto";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

const writeClient =
  projectId && token
    ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false })
    : null;

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_PHONE_PER_WINDOW = 5;
const MAX_PER_IP_PER_WINDOW = 20;
const MIN_GAP_MS = 60 * 1000; // 60s between sends for the same key

export type RateLimitResult = { allowed: true } | { allowed: false; reason: "too-frequent" | "too-many" | "unavailable" };

type ExistingLog = { count: number; windowStartedAt: string; lastRequestedAt: string } | null;

type Evaluation =
  | { allowed: true; docId: string; isNew: boolean; windowExpired: boolean }
  | { allowed: false; reason: "too-frequent" | "too-many" };

/** Read-only — decides whether `key` would be allowed, without writing anything yet. */
async function evaluate(key: string, maxPerWindow: number, now: number): Promise<Evaluation> {
  const docId = `otpRequestLog-${sha256Hex(key)}`;
  const existing = await writeClient!.fetch<ExistingLog>(
    `*[_id == $id][0]{count, windowStartedAt, lastRequestedAt}`,
    { id: docId },
  );

  if (!existing) return { allowed: true, docId, isNew: true, windowExpired: false };

  const windowStartedAt = new Date(existing.windowStartedAt).getTime();
  const lastRequestedAt = new Date(existing.lastRequestedAt).getTime();
  const windowExpired = now - windowStartedAt > WINDOW_MS;

  if (!windowExpired && now - lastRequestedAt < MIN_GAP_MS) {
    return { allowed: false, reason: "too-frequent" };
  }
  if (!windowExpired && existing.count >= maxPerWindow) {
    return { allowed: false, reason: "too-many" };
  }
  return { allowed: true, docId, isNew: false, windowExpired };
}

/** Writes the actual increment/create — only called once every key involved has already been evaluated as allowed. */
async function commit(key: string, evaluation: Extract<Evaluation, { allowed: true }>, now: number): Promise<void> {
  const nowIso = new Date(now).toISOString();
  if (evaluation.isNew) {
    await writeClient!.createIfNotExists({
      _id: evaluation.docId,
      _type: "otpRequestLog",
      key,
      count: 1,
      windowStartedAt: nowIso,
      lastRequestedAt: nowIso,
    });
    return;
  }
  if (evaluation.windowExpired) {
    await writeClient!.patch(evaluation.docId).set({ key, count: 1, windowStartedAt: nowIso, lastRequestedAt: nowIso }).commit();
    return;
  }
  await writeClient!.patch(evaluation.docId).set({ lastRequestedAt: nowIso }).inc({ count: 1 }).commit();
}

/**
 * This is the real cost-abuse defense — the OTP challenge cookie is
 * client-held and an attacker can just drop it, so the send-side throttle
 * must live server-side, backed by a Sanity doc per rate-limit key.
 *
 * Both the phone and IP keys are evaluated (read-only) before either is
 * committed (written) — so a request that's ultimately rejected by one key
 * never burns a unit of the other key's quota. Checked before any sender is
 * called, so a blocked request never costs money either.
 */
export async function checkOtpRateLimit(phone: string, ipHash: string): Promise<RateLimitResult> {
  if (!writeClient) {
    // No Sanity write access configured (e.g. local dev without a token) —
    // fail open so the flow is still testable, matching saveOrder's fallback.
    console.error("OTP rate limit check skipped — SANITY_API_TOKEN is not configured.");
    return { allowed: true };
  }

  const now = Date.now();
  const phoneKey = `phone:${phone}`;
  const ipKey = `ip:${ipHash}`;

  try {
    const phoneEval = await evaluate(phoneKey, MAX_PER_PHONE_PER_WINDOW, now);
    if (!phoneEval.allowed) return phoneEval;

    const ipEval = await evaluate(ipKey, MAX_PER_IP_PER_WINDOW, now);
    if (!ipEval.allowed) return ipEval;

    await commit(phoneKey, phoneEval, now);
    await commit(ipKey, ipEval, now);
    return { allowed: true };
  } catch (error) {
    console.error("OTP rate limit check failed:", error);
    return { allowed: false, reason: "unavailable" };
  }
}

/** Hashes a client IP before it's ever written to Sanity or logged. */
export function hashIp(ip: string): string {
  return sha256Hex(ip);
}
