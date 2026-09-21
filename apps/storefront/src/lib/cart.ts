import "server-only";
import { cookies } from "next/headers";
import { medusa } from "@/lib/medusa";

const CART_COOKIE = "leyros_cart_id";
const REGION_ID = process.env.MEDUSA_INDIA_REGION_ID;

/**
 * Cart state lives entirely server-side in Medusa (plan §5) — this cookie
 * only carries the cart id, never cart contents, so the cart survives a
 * session timeout or device switch.
 */
export async function getOrCreateCart() {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(CART_COOKIE)?.value;

  if (existingId) {
    try {
      const { cart } = await medusa.store.cart.retrieve(existingId);
      return cart;
    } catch {
      // Cart no longer exists (expired/deleted) — fall through and create a new one.
    }
  }

  const { cart } = await medusa.store.cart.create({
    region_id: REGION_ID,
  });
  cookieStore.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart;
}

export async function getCartId() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value ?? null;
}
