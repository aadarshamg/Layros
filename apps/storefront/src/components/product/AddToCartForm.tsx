"use client";

import { useActionState, useState } from "react";
import type { PerfumeVariant } from "@leyros/types";
import { addToCartAction } from "@/app/products/[handle]/actions";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function AddToCartForm({ variants }: { variants: PerfumeVariant[] }) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [engraving, setEngraving] = useState("");
  const [font, setFont] = useState("Classic");
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, isPending] = useActionState(addToCartAction, null);
  const selected = variants.find((variant) => variant.id === selectedVariantId);
  const fonts = ["Classic", "Elegant", "Cursive", "Roman"];

  return (
    <form action={formAction} className="purchase-form">
      <input type="hidden" name="variantId" value={selectedVariantId} />
      <input type="hidden" name="font" value={font} />
      <input type="hidden" name="quantity" value={quantity} />

      <div className="purchase-field-heading">
        <p className="size-label">Choose your flacon</p>
        <span>{selected?.inventoryQuantity ? "Ready in the atelier" : "Made by request"}</span>
      </div>
      <div className="size-grid">
        {variants.map((variant) => (
          <button key={variant.id} type="button" onClick={() => setSelectedVariantId(variant.id)} className={`size-option ${selectedVariantId === variant.id ? "selected" : ""}`}>
            <b>{variant.sizeMl} ml</b><small>{formatInr(variant.price)}</small>
          </button>
        ))}
      </div>

      <div className="personalize-block">
        <div className="purchase-field-heading">
          <label htmlFor="engraving">Complimentary engraving</label>
          <span>{engraving.length}/18</span>
        </div>
        <input
          id="engraving"
          name="engraving"
          className={`engraving-input engraving-${font.toLowerCase()}`}
          value={engraving}
          maxLength={18}
          onChange={(event) => setEngraving(event.target.value)}
          placeholder="Your name or initials"
        />
        <p className="field-hint">Leave blank for the signature Leyros flacon.</p>
        <p className="size-label font-label">Choose lettering</p>
        <div className="font-grid">
          {fonts.map((fontName) => (
            <button
              key={fontName}
              type="button"
              onClick={() => setFont(fontName)}
              className={`font-option font-${fontName.toLowerCase()} ${font === fontName ? "selected" : ""}`}
            >
              {fontName}
            </button>
          ))}
        </div>
      </div>

      <div className="purchase-actions">
        <div className="quantity-control" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(5, value + 1))}>+</button>
        </div>
        <button type="submit" disabled={isPending || !selectedVariantId} className="acquire-button">
          {isPending ? "Preparing your flacon…" : `Add to bag · ${formatInr((selected?.price ?? 0) * quantity)}`}
        </button>
      </div>
      {state?.error && <p className="form-message error">{state.error}</p>}
      {state?.success && <p className="form-message success">Added to your boutique bag.</p>}
    </form>
  );
}
