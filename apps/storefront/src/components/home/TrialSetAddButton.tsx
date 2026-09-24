"use client";

import { useState } from "react";
import type { PerfumeVariant } from "@leyros/types";
import { useCart } from "@/lib/cart-context";

export function TrialSetAddButton({
  productId,
  handle,
  title,
  image,
  variant,
}: {
  productId: string;
  handle: string;
  title: string;
  image?: string;
  variant: PerfumeVariant;
}) {
  const { addItem, openDrawer } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem({
      productId,
      handle,
      variantId: variant.id,
      title,
      image,
      sizeMl: variant.sizeMl,
      sizeLabel: variant.sizeLabel,
      sku: variant.sku,
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity: 1,
    });
    setJustAdded(true);
    openDrawer();
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <button type="button" onClick={handleClick} className="trial-set-add">
      {justAdded ? "Added ✓" : "Add to cart"}
    </button>
  );
}
