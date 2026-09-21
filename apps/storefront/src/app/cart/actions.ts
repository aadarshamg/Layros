"use server";

import { revalidatePath } from "next/cache";
import { medusa } from "@/lib/medusa";
import { getCartId } from "@/lib/cart";

export async function updateLineItemQuantity(lineItemId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId) return;

  if (quantity <= 0) {
    await medusa.store.cart.deleteLineItem(cartId, lineItemId);
  } else {
    await medusa.store.cart.updateLineItem(cartId, lineItemId, { quantity });
  }
  revalidatePath("/cart");
  revalidatePath("/checkout/payment");
}

export async function removeLineItem(lineItemId: string) {
  const cartId = await getCartId();
  if (!cartId) return;
  await medusa.store.cart.deleteLineItem(cartId, lineItemId);
  revalidatePath("/cart");
}
