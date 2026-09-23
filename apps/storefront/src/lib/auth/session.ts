import "server-only";
import { cookies } from "next/headers";
import { createClient } from "next-sanity";
import { signPayload, verifyPayload } from "./crypto";
import type { Customer } from "@leyros/types";

const SESSION_COOKIE = "leyros_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

const readClient =
  projectId && token
    ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false })
    : null;

interface SessionPayload {
  customerId: string;
  phone: string;
  tokenVersion: number;
  issuedAt: number;
  expiresAt: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SIGNING_SECRET;
  if (!secret) throw new Error("SESSION_SIGNING_SECRET is not configured");
  return secret;
}

export async function createSession(customerId: string, phone: string, tokenVersion: number): Promise<void> {
  const now = Date.now();
  const payload: SessionPayload = {
    customerId,
    phone,
    tokenVersion,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };
  const store = await cookies();
  store.set(SESSION_COOKIE, signPayload(payload, getSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Cookie-only check, no Sanity call — safe to use on every request (e.g. to derive customerId for order-linking). */
export async function getSessionCustomerId(): Promise<string | null> {
  const store = await cookies();
  const payload = verifyPayload<SessionPayload>(store.get(SESSION_COOKIE)?.value, getSecret());
  if (!payload) return null;
  if (Date.now() > payload.expiresAt) return null;
  return payload.customerId;
}

/**
 * Verifies the session cookie and fetches the full profile, checking
 * tokenVersion against Sanity so "log out everywhere" (which bumps it)
 * takes effect immediately without a server-side session store.
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
  const store = await cookies();
  const payload = verifyPayload<SessionPayload>(store.get(SESSION_COOKIE)?.value, getSecret());
  if (!payload) return null;
  if (Date.now() > payload.expiresAt) return null;
  if (!readClient) return null;

  try {
    const doc = await readClient.fetch<{
      _id: string;
      phone: string;
      name?: string;
      email?: string;
      defaultShippingAddress?: Customer["defaultShippingAddress"];
      marketingOptIn?: boolean;
      tokenVersion?: number;
    } | null>(
      `*[_id == $id][0]{_id, phone, name, email, defaultShippingAddress, marketingOptIn, tokenVersion}`,
      { id: payload.customerId },
    );

    if (!doc) return null;
    if ((doc.tokenVersion ?? 0) !== payload.tokenVersion) return null;

    return {
      id: doc._id,
      phone: doc.phone,
      name: doc.name,
      email: doc.email,
      defaultShippingAddress: doc.defaultShippingAddress,
      marketingOptIn: doc.marketingOptIn ?? false,
    };
  } catch (error) {
    console.error("Failed to load current customer:", error);
    return null;
  }
}
