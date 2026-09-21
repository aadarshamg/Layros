import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getOrCreateCart } from "@/lib/cart";
import { CartLineItem } from "@/components/checkout/CartLineItem";

export const metadata: Metadata = buildMetadata({
  title: "Your Cart",
  description: "Review your fragrances before checkout.",
  path: "/cart",
});

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function CartPage() {
  let cart;
  try {
    cart = await getOrCreateCart();
  } catch {
    cart = null;
  }

  const items = cart?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl">Your Cart</h1>

      {!cart ? (
        <p className="mt-6 text-charcoal-soft/70">
          Could not reach the store. Connect the Medusa backend (plan §2) to use the cart.
        </p>
      ) : items.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-charcoal-soft/70">Your cart is empty.</p>
          <Link
            href="/collections/all"
            className="mt-6 inline-block border border-charcoal px-8 py-3 text-sm uppercase tracking-widest hover:bg-charcoal hover:text-offwhite"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
          </ul>

          <aside className="h-fit border border-border p-6 text-sm">
            <p className="mb-4 font-medium uppercase tracking-widest">Order summary</p>
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{formatInr(cart.item_subtotal ?? cart.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1 text-charcoal-soft/70">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium">
              <span>Total</span>
              <span>{formatInr(cart.total ?? 0)}</span>
            </div>
            <Link
              href="/checkout/details"
              className="mt-6 block bg-charcoal py-4 text-center text-sm uppercase tracking-widest text-offwhite"
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
