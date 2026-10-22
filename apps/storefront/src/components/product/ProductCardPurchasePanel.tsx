"use client";

import { useState } from "react";
import type { PerfumeProduct } from "@leyros/types";
import { useCart } from "@/lib/cart-context";
import { formatInr, formatSize } from "@/lib/format";
import { genderLabel, productScentLine } from "@/lib/product-labels";
import { DiyaIcon } from "@/components/product/DiyaIcon";
import { isSoldOut } from "@/lib/stock";
import { defaultVariant } from "@/lib/variants";

export function ProductCardPurchasePanel({ product, homepage = false }: { product: PerfumeProduct; homepage?: boolean }) {
  const { addItem, openDrawer } = useCart();
  const sortedVariants = product.variants
    .filter((item) => !homepage || (item.sizeMl !== 100 && item.sizeMl !== 200))
    .sort((a, b) => a.price - b.price);
  const [selectedId, setSelectedId] = useState(defaultVariant(sortedVariants)?.id);
  const [justAdded, setJustAdded] = useState(false);
  const variant = sortedVariants.find((item) => item.id === selectedId) ?? sortedVariants[0];

  if (!variant) return null;

  const compareAt = variant.compareAtPrice && variant.compareAtPrice > variant.price
    ? variant.compareAtPrice
    : variant.price;
  const discount = compareAt > variant.price
    ? Math.round((1 - variant.price / compareAt) * 100)
    : 0;
  const gender = genderLabel(product);
  const notesLabel = productScentLine(product);
  const rotateNotes = /collections|perfume/i.test(product.category ?? "") && !/car|attar/i.test(product.category ?? "");

  const soldOut = isSoldOut(variant);

  function handleQuickAdd() {
    if (soldOut) return;
    addItem({
      productId: product.id,
      handle: product.handle,
      variantId: variant.id,
      title: product.title,
      category: product.category,
      image: product.images[0],
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
    <div className="product-card-purchase">
      {rotateNotes ? (
        <div className="product-card-scent product-card-rotating-notes">
          <span className="sr-only">Fragrance Family. Daily Use. Eau de Parfum.</span>
          <span className="product-notes-window" aria-hidden="true">
            <span className="product-notes-track">
              <span>Fragrance Family</span>
              <span>Daily Use</span>
              <span>Eau de Parfum</span>
              <span>Fragrance Family</span>
            </span>
          </span>
        </div>
      ) : (
        <p className="product-card-scent" aria-label={notesLabel ? (gender ? "Perfume notes" : "Fragrance profile") : undefined} aria-hidden={!notesLabel || undefined}>{notesLabel}</p>
      )}

      {!homepage && <div className="product-card-info-group product-card-size-group">
        <div className="product-card-sizes" aria-label="Choose product size">
          {sortedVariants.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`product-card-size${item.id === variant.id ? " is-selected" : ""}${isSoldOut(item) ? " is-sold-out" : ""}`}
              aria-label={isSoldOut(item) ? `${formatSize(item.sizeMl, item.sizeLabel)}, sold out` : undefined}
            >
              {formatSize(item.sizeMl, item.sizeLabel)}
            </button>
          ))}
        </div>
      </div>}

      <div className="product-card-pricing" aria-label="Product pricing">
        {/* Price and MRP on the left; the % off pill on the right. */}
        <div className="product-card-price-main">
          <p className="product-card-price-line">
            {/* Sizes are hidden on homepage cards, so say which size the price is for. */}
            {homepage && product.variants.length > 1 && <span className="product-card-price-size">{formatSize(variant.sizeMl, variant.sizeLabel)}</span>}
            <span className="product-card-price-now">{formatInr(variant.price)}</span>
            {discount > 0 && <span className="product-card-price-mrp">MRP <s>{formatInr(compareAt)}</s></span>}
          </p>
        </div>
        {discount > 0 && <span className="product-card-price-off">{discount}% OFF</span>}
      </div>

      <button type="button" onClick={handleQuickAdd} disabled={soldOut} className="product-card-quick-add">
        <DiyaIcon />
        <span>{soldOut ? "Sold out" : justAdded ? "Added ✓" : "Add to cart"}</span>
        <DiyaIcon />
      </button>
    </div>
  );
}
