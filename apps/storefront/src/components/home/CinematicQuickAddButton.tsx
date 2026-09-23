"use client";

import { useState } from "react";
import type { PerfumeProduct, PerfumeVariant } from "@leyros/types";
import { useCart } from "@/lib/cart-context";

// Quick-adds the cheapest variant straight from the grid, no detour through
// the product page — mirrors the shoppable video tiles' "Add to cart"
// behavior. Customers who want to pick a size still click through via the
// product image/title link right above this.
export function CinematicQuickAddButton({ product }: { product: PerfumeProduct }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const variant: PerfumeVariant | undefined = [...product.variants].sort((a, b) => a.price - b.price)[0];

  function handleClick() {
    if (!variant) return;
    addItem({
      productId: product.id,
      handle: product.handle,
      variantId: variant.id,
      title: product.title,
      image: product.images[0],
      sizeMl: variant.sizeMl,
      sku: variant.sku,
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity: 1,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  if (!variant) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`cinematic-quick-add${justAdded ? " added" : ""}`}
    >
      <span className="cinematic-quick-add-label">{justAdded ? "Added ✓" : "Add to cart"}</span>
    </button>
  );
}
