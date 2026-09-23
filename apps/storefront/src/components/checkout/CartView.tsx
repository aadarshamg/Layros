"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CartLineItem } from "@/components/checkout/CartLineItem";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CartView() {
  const { items, subtotal, isReady } = useCart();

  // Avoid flashing "empty cart" before localStorage has been read on mount.
  if (!isReady) return null;

  if (items.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="text-charcoal-soft/70">Your cart is empty.</p>
        <Link
          href="/collections/all"
          className="mt-6 inline-block rounded-full border border-charcoal px-8 py-3 text-sm uppercase tracking-widest hover:bg-charcoal hover:text-offwhite"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[1fr_320px]">
      <ul className="cart-page-lines">
        {items.map((item) => (
          <CartLineItem key={item.id} item={item} />
        ))}
      </ul>

      <aside className="cart-page-summary h-fit rounded-3xl p-6 text-sm">
        <p className="mb-4 font-medium uppercase tracking-widest">Order summary</p>
        <div className="flex justify-between py-1">
          <span>Subtotal</span>
          <span>{formatInr(subtotal)}</span>
        </div>
        <div className="flex justify-between py-1 text-charcoal-soft/70">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="cart-page-total mt-3 flex justify-between pt-3 font-medium">
          <span>Total</span>
          <span>{formatInr(subtotal)}</span>
        </div>
        <Link
          href="/checkout/details"
          className="cart-page-checkout mt-6 block rounded-full py-4 text-center text-sm uppercase tracking-widest text-offwhite"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}
