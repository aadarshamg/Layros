"use server";

import { revalidatePath } from "next/cache";
import { medusa } from "@/lib/medusa";
import { getOrCreateCart } from "@/lib/cart";

export async function addToCartAction(_prevState: unknown, formData: FormData) {
  const variantId = formData.get("variantId");
  const rawQuantity = Number(formData.get("quantity"));
  const quantity = Number.isFinite(rawQuantity) ? Math.min(5, Math.max(1, Math.floor(rawQuantity))) : 1;
  const engraving = String(formData.get("engraving") ?? "").trim().slice(0, 18);
  const font = String(formData.get("font") ?? "Classic").slice(0, 20);
  if (typeof variantId !== "string" || !variantId) {
    return { error: "Select a size first." };
  }

  try {
    const cart = await getOrCreateCart();
    await medusa.store.cart.createLineItem(cart.id, {
      variant_id: variantId,
      quantity,
      metadata: engraving ? { engraving, engraving_font: font } : undefined,
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add this item to your cart.",
    };
  }
}
