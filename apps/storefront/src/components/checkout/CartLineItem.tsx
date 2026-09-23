"use client";

import Image from "next/image";
import { useCart, type CartLine } from "@/lib/cart-context";
import { formatSize } from "@/lib/format";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CartLineItem({ item }: { item: CartLine }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <li className="flex gap-4 py-5">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-ivory">
        {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="font-serif text-lg">{item.title}</p>
          <p className="text-sm text-charcoal-soft/60">{formatSize(item.sizeMl, item.sizeLabel)}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="h-7 w-7 rounded-full border border-border"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="h-7 w-7 rounded-full border border-border"
              aria-label="Increase quantity"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="ml-3 text-charcoal-soft/60 underline underline-offset-4 hover:text-charcoal"
            >
              Remove
            </button>
          </div>
          <p className="font-medium">{formatInr(item.unitPrice * item.quantity)}</p>
        </div>
      </div>
    </li>
  );
}
