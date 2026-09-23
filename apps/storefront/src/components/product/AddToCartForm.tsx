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
  image?: string;
  variants: PerfumeVariant[];
}

export function AddToCartForm({ productId, handle, title, image, variants }: AddToCartFormProps) {
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
        <p className="size-label">Choose a variant</p>
        <span>{selected?.inventoryQuantity ? "Ready in the atelier" : "Made by request"}</span>
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
      <p className="delivery-note">* Dispatches within 24–48 hours of ordering.</p>
      {justAdded && <p className="form-message success">Added to your boutique bag.</p>}
    </form>
  );
}
