"use client";

import Image from "next/image";
import { useState } from "react";
import type { PerfumeVariant } from "@leyros/types";
import { useCart } from "@/lib/cart-context";
import { formatSize } from "@/lib/format";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

interface AddToCartFormProps {
  productId: string;
  handle: string;
  title: string;
  category?: string;
  image?: string;
  variants: PerfumeVariant[];
}

export function AddToCartForm({ productId, handle, title, category, image, variants }: AddToCartFormProps) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === selectedVariantId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    addItem({
      productId,
      handle,
      variantId: selected.id,
      title,
      category,
      image,
      sizeMl: selected.sizeMl,
      sizeLabel: selected.sizeLabel,
      sku: selected.sku,
      unitPrice: selected.price,
      compareAtPrice: selected.compareAtPrice,
      quantity,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="purchase-form">
      <div className="purchase-field-heading">
        <p className="size-label">Size</p>
      </div>
      <div className="size-grid">
        {variants.map((variant) => (
          <button key={variant.id} type="button" onClick={() => setSelectedVariantId(variant.id)} className={`size-option ${selectedVariantId === variant.id ? "selected" : ""}`}>
            {image && (
              <span className="variant-image">
                <Image src={image} alt="" fill sizes="110px" />
              </span>
            )}
            <span className="variant-copy"><b>{formatSize(variant.sizeMl, variant.sizeLabel)}</b><small>{formatInr(variant.price)}</small></span>
          </button>
        ))}
      </div>

      {selected && (
        <aside className="product-snapmint" aria-label="Snapmint EMI payment option">
          <span className="product-snapmint-tag">NEW</span>
          <span className="product-snapmint-copy">
            Pay <b>{formatInr(Math.round(selected.price / 3))}</b> now, rest later by
            <strong>snapmint</strong>
          </span>
          <a
            href="https://snapmint.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Snapmint EMI plans on the official Snapmint website (opens in a new tab)"
          >
            View Plans <span aria-hidden="true">›</span>
          </a>
        </aside>
      )}

      <div className="purchase-actions">
        <div className="quantity-control" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(5, value + 1))}>+</button>
        </div>
        <button type="submit" disabled={!selectedVariantId} className={`acquire-button${justAdded ? " added" : ""}`}>
          <span className="acquire-button-label">
            {justAdded ? "Added ✓" : `Add to cart · ${formatInr((selected?.price ?? 0) * quantity)}`}
          </span>
        </button>
      </div>
      {justAdded && <p className="form-message success">Added to your boutique bag.</p>}
    </form>
  );
}
