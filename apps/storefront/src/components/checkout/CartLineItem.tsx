"use client";

import Image from "next/image";
import { useTransition } from "react";
import { removeLineItem, updateLineItemQuantity } from "@/app/cart/actions";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Medusa's StoreCartLineItem type; kept loose here since the cart is fetched
// server-side and passed straight through.
interface LineItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  thumbnail?: string | null;
  variant?: { title?: string | null } | null;
}

export function CartLineItem({ item }: { item: LineItem }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex gap-4 py-5">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-ivory">
        {item.thumbnail && <Image src={item.thumbnail} alt={item.title} fill className="object-cover" />}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="font-serif text-lg">{item.title}</p>
          {item.variant?.title && (
            <p className="text-sm text-charcoal-soft/60">{item.variant.title}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() => updateLineItemQuantity(item.id, item.quantity - 1))
              }
              className="h-7 w-7 border border-border"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{item.quantity}</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() => updateLineItemQuantity(item.id, item.quantity + 1))
              }
              className="h-7 w-7 border border-border"
              aria-label="Increase quantity"
            >
              +
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => removeLineItem(item.id))}
              className="ml-3 text-charcoal-soft/60 underline underline-offset-4 hover:text-charcoal"
            >
              Remove
            </button>
          </div>
          <p className="font-medium">{formatInr(item.unit_price * item.quantity)}</p>
        </div>
      </div>
    </li>
  );
}
