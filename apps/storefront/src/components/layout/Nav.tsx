import { medusa } from "@/lib/medusa";
import { getCartId } from "@/lib/cart";
import { NavView } from "@/components/layout/NavView";

export async function Nav() {
  let bagCount = 0;

  try {
    const cartId = await getCartId();
    if (cartId) {
      const { cart } = await medusa.store.cart.retrieve(cartId);
      bagCount = (cart.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
    }
  } catch {
    // Keep the header available when the commerce backend is offline.
  }

  return <NavView bagCount={bagCount} />;
}
