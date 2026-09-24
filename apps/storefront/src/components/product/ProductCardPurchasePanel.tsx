"use client";

import { useState } from "react";
import type { PerfumeProduct } from "@leyros/types";
import { useCart } from "@/lib/cart-context";
import { formatInr, formatSize } from "@/lib/format";

/**
 * Price + size picker + quick-add, shared by the collections grid and the
 * homepage cinematic grid so both stay in sync. The EMI line is a display-only
 * placeholder (price split into 3) until a real financing partner is wired in.
 */
export function ProductCardPurchasePanel({ product }: { product: PerfumeProduct }) {
  const { addItem } = useCart();
  const sortedVariants = [...product.variants].sort((a, b) => a.price - b.price);
  const [selectedId, setSelectedId] = useState(sortedVariants[0]?.id);
  const [justAdded, setJustAdded] = useState(false);
  const variant = sortedVariants.find((v) => v.id === selectedId) ?? sortedVariants[0];

  if (!variant) return null;

  const compareAt = variant.compareAtPrice;
  const emiMonthly = Math.round(variant.price / 3);

  function handleQuickAdd() {
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

  return (
    <div className="product-card-purchase">
      <p className="product-card-price">
        {formatInr(variant.price)}
        {compareAt && compareAt > variant.price && <s>{formatInr(compareAt)}</s>}
      </p>
      <p className="product-card-emi">
        or {formatInr(emiMonthly)}/Month <span className="product-card-emi-badge">Buy on EMI</span>
      </p>
      {sortedVariants.length > 1 && (
        <div className="product-card-sizes">
          {sortedVariants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={`product-card-size${v.id === variant.id ? " is-selected" : ""}`}
            >
              {formatSize(v.sizeMl, v.sizeLabel)}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={handleQuickAdd} className="product-card-quick-add">
        {justAdded ? "Added ✓" : "Quick Add"}
      </button>
    </div>
  );
}
