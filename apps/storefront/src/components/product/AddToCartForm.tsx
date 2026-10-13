"use client";

import { useState } from "react";
import type { PerfumeVariant } from "@leyros/types";
import { useCart } from "@/lib/cart-context";
import { formatSize } from "@/lib/format";
import { DiyaIcon } from "@/components/product/DiyaIcon";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

/** A real offer the shopper unlocks with this selection, by order value or by quantity. */
export interface PurchasePerk {
  key: string;
  /** What it takes, e.g. "₹999" or "Any 3". */
  value: string;
  /** What they get, e.g. "Free shipping". */
  label: string;
  icon: "truck" | "bottles" | "gift";
  minAmount?: number;
  minQuantity?: number;
}

interface AddToCartFormProps {
  productId: string;
  handle: string;
  title: string;
  category?: string;
  image?: string;
  variants: PerfumeVariant[];
  /** Short capitals line under the sizes, e.g. "Neroli. Lavender. Amber." */
  tagline?: string;
  /** One short sentence about the product; the full description sits lower on the page. */
  summary?: string;
  perks?: PurchasePerk[];
}

const PERK_ICONS: Record<PurchasePerk["icon"], React.ReactNode> = {
  truck: (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M5 14h23v18H5zM28 20h8l7 7v5H28z" />
      <circle cx="14" cy="34" r="4" className="purchase-perk-wheel" />
      <circle cx="35" cy="34" r="4" className="purchase-perk-wheel" />
    </svg>
  ),
  bottles: (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M8 21h9v19H8zM10 15h5v6h-5zM19.5 17h9v23h-9zM21.5 10h5v7h-5zM31 21h9v19h-9zM33 15h5v6h-5z" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M8 22h32v19H8zM6 15h36v7H6z" />
      <path d="M24 15c-4-8-12-7-11-2 1 3 7 2 11 2zm0 0c4-8 12-7 11-2-1 3-7 2-11 2z" />
      <path d="M22 15h4v26h-4z" className="purchase-perk-ribbon" />
    </svg>
  ),
};

export function AddToCartForm({ productId, handle, title, category, image, variants, tagline, summary, perks = [] }: AddToCartFormProps) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === selectedVariantId);
  const compareAtPrice = selected?.compareAtPrice && selected.compareAtPrice > selected.price ? selected.compareAtPrice : undefined;
  const discountPercent = compareAtPrice && selected ? Math.round(((compareAtPrice - selected.price) / compareAtPrice) * 100) : 0;
  const amount = (selected?.price ?? 0) * quantity;
  const isReached = (perk: PurchasePerk) =>
    (perk.minAmount !== undefined && amount >= perk.minAmount) || (perk.minQuantity !== undefined && quantity >= perk.minQuantity);

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
      <div className="purchase-top">
        <div className="purchase-price" aria-live="polite">
          <div>
            <strong>{formatInr(selected?.price ?? 0)}</strong>
            {compareAtPrice && <s>{formatInr(compareAtPrice)}</s>}
            {discountPercent > 0 && <b>{discountPercent}% off</b>}
          </div>
          <span>Incl. of all taxes</span>
        </div>
        <div className="quantity-control" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(5, value + 1))}>+</button>
        </div>
      </div>

      <div className="purchase-field-heading">
        <p className="size-label">Select one:</p>
      </div>
      <div className="size-grid">
        {variants.map((variant) => (
          <button key={variant.id} type="button" aria-pressed={selectedVariantId === variant.id} onClick={() => setSelectedVariantId(variant.id)} className={`size-option ${selectedVariantId === variant.id ? "selected" : ""}`}>
            <span className="variant-copy"><b>{formatSize(variant.sizeMl, variant.sizeLabel)}</b></span>
          </button>
        ))}
      </div>

      {tagline && <p className="purchase-tagline">{tagline}</p>}
      {summary && <p className="purchase-summary">{summary}</p>}

      {perks.length > 0 && (
        <ul className="purchase-perks" aria-label="Offers you unlock">
          {perks.map((perk) => (
            <li key={perk.key} className={isReached(perk) ? "is-reached" : undefined}>
              <span className="purchase-perk-icon">{PERK_ICONS[perk.icon]}</span>
              <b>{perk.value}</b>
              <small>{perk.label}</small>
              <i className="purchase-perk-dot" aria-hidden="true" />
              {isReached(perk) && <span className="sr-only">Unlocked</span>}
            </li>
          ))}
        </ul>
      )}

      <button type="submit" disabled={!selectedVariantId} className={`acquire-button${justAdded ? " added" : ""}`}>
        <DiyaIcon />
        <span className="acquire-button-label">
          {justAdded ? "Added ✓" : `Add to cart – ${formatInr(amount)}`}
        </span>
        <DiyaIcon />
      </button>
      {selected && <p className="purchase-installments">Or 3 payments of {formatInr(Math.round(selected.price / 3))} with <a href="https://snapmint.com/" target="_blank" rel="noopener noreferrer">Snapmint</a></p>}
      {justAdded && <p className="form-message success">Added to your boutique bag.</p>}
    </form>
  );
}
