"use client";

import { useState } from "react";
import type { PerfumeProduct } from "@leyros/types";
import { useCart } from "@/lib/cart-context";
import { formatInr, formatSize } from "@/lib/format";
import { genderLabel, productCardCategoryLabel } from "@/lib/product-labels";

export function ProductCardPurchasePanel({ product }: { product: PerfumeProduct }) {
  const { addItem, openDrawer } = useCart();
  const sortedVariants = [...product.variants].sort((a, b) => a.price - b.price);
  const [selectedId, setSelectedId] = useState(sortedVariants[0]?.id);
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
  const classification = gender ?? productCardCategoryLabel(product);
  const notes = [...product.details.notesTop, ...product.details.notesHeart, ...product.details.notesBase]
    .filter((note, index, all) => note && all.indexOf(note) === index)
    .slice(0, 3);
  const notesLabel = notes.length ? notes.join(" • ") : product.details.family;

  function handleQuickAdd() {
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
      <div className="product-card-info-group product-card-size-group">
        <span className="product-card-info-label">ML / Size</span>
        <div className="product-card-sizes" aria-label="Choose product size">
          {sortedVariants.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`product-card-size${item.id === variant.id ? " is-selected" : ""}`}
            >
              {formatSize(item.sizeMl, item.sizeLabel)}
            </button>
          ))}
        </div>
      </div>

      <p className="product-card-notes">
        <span className="product-card-info-label">{gender ? "Perfume Notes" : "Fragrance Profile"}</span>
        <strong>{notesLabel}</strong>
      </p>

      <div className="product-card-pricing" aria-label="Product pricing">
        <span className="product-card-price-label">Selling Price</span>
        <p className="product-card-price-line">
          <span className="product-card-price-now">{formatInr(variant.price)}</span>
          {discount > 0 && (
            <>
              <span className="product-card-price-mrp">MRP <s>{formatInr(compareAt)}</s></span>
              <span className="product-card-price-off">{discount}% OFF</span>
            </>
          )}
        </p>
      </div>

      <div className="product-card-classification" aria-label={gender ? "Perfume classification" : "Product classification"}>
        <span>{gender ? "Gender" : "Product Type"}</span>
        <strong>{classification}</strong>
      </div>

      <button type="button" onClick={handleQuickAdd} className="product-card-quick-add">
        {justAdded ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
