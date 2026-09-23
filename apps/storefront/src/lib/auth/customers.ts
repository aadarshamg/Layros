import "server-only";
import { createClient } from "next-sanity";
import type { ShippingAddress } from "@leyros/types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

const writeClient =
  projectId && token
    ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false })
    : null;

export function customerIdForPhone(phone: string): string {
  return `customer-${phone}`;
}

export interface FindOrCreateResult {
  customerId: string;
  tokenVersion: number;
  isNewCustomer: boolean;
}

/**
 * Both login and signup hit this same function — there's no separate signup
 * step, verifying the phone via OTP *is* the signup. The deterministic _id
 * makes createIfNotExists a safe, race-proof "get or create" with no
 * uniqueness check needed.
 */
export async function findOrCreateCustomerByPhone(phone: string): Promise<FindOrCreateResult> {
  if (!writeClient) {
    throw new Error("Cannot create/find customer — SANITY_API_TOKEN is not configured.");
  }

  const customerId = customerIdForPhone(phone);
  const now = new Date().toISOString();

  const existing = await writeClient.fetch<{ tokenVersion?: number } | null>(`*[_id == $id][0]{tokenVersion}`, {
    id: customerId,
  });

  if (existing) {
    return { customerId, tokenVersion: existing.tokenVersion ?? 0, isNewCustomer: false };
  }

  await writeClient.createIfNotExists({
    _id: customerId,
    _type: "customer",
    phone,
    marketingOptIn: false,
    tokenVersion: 0,
    createdAt: now,
    lastLoginAt: now,
  });

  return { customerId, tokenVersion: 0, isNewCustomer: true };
}

export async function updateLastLogin(customerId: string): Promise<void> {
  if (!writeClient) return;
  try {
    await writeClient.patch(customerId).set({ lastLoginAt: new Date().toISOString() }).commit();
  } catch (error) {
    console.error("Failed to update lastLoginAt:", customerId, error);
  }
}

/** Best-effort — called after a successful order so next checkout is pre-filled. Never blocks the order itself. */
export async function patchDefaultAddress(customerId: string, address: ShippingAddress): Promise<void> {
  if (!writeClient) return;
  try {
    await writeClient.patch(customerId).set({ defaultShippingAddress: address }).commit();
  } catch (error) {
    console.error("Failed to save default address:", customerId, error);
  }
}

export async function bumpTokenVersion(customerId: string): Promise<void> {
  if (!writeClient) throw new Error("Cannot bump token version — SANITY_API_TOKEN is not configured.");
  await writeClient.patch(customerId).setIfMissing({ tokenVersion: 0 }).inc({ tokenVersion: 1 }).commit();
}

export async function updateProfile(
  customerId: string,
  updates: { name?: string; email?: string; marketingOptIn?: boolean },
): Promise<void> {
  if (!writeClient) throw new Error("Cannot update profile — SANITY_API_TOKEN is not configured.");
  await writeClient.patch(customerId).set(updates).commit();
}
