"use client";

import { useEffect } from "react";
import type { CartLine } from "@/lib/cart-context";
import { CART_STORAGE_KEY } from "@/lib/cart-context";

export function RestoreCart({ lines }: { lines: CartLine[] }) {
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage blocked — the homepage still opens; the shopper just re-adds items.
    }
    window.location.replace("/?cart=open");
  }, [lines]);

  return null;
}
