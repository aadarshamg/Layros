"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PerfumeProduct } from "@leyros/types";
import { useCart } from "@/lib/cart-context";
import { formatInr, formatSize } from "@/lib/format";

export function ProductOfMonth({
  product,
  unitsSold,
  isSalesBased,
}: {
  product: PerfumeProduct;
  unitsSold: number;
  isSalesBased: boolean;
}) {
  const { addItem, openDrawer } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const selected = product.variants.find((variant) => variant.id === selectedVariantId);
  const secondaryImage = product.images[1] ?? product.images[0];
  const discount = selected?.compareAtPrice && selected.compareAtPrice > selected.price
    ? Math.round((1 - selected.price / selected.compareAtPrice) * 100)
    : null;
  const notes = [product.details.notesTop[0], product.details.notesHeart[0], product.details.notesBase[0]].filter(Boolean);

  function addToBag() {
    if (!selected) return;
    addItem({
      productId: product.id,
      handle: product.handle,
      variantId: selected.id,
      title: product.title,
      image: product.images[0],
      sizeMl: selected.sizeMl,
      sizeLabel: selected.sizeLabel,
      sku: selected.sku,
      unitPrice: selected.price,
      compareAtPrice: selected.compareAtPrice,
      quantity: 1,
    });
    openDrawer();
  }

  return (
    <section className="product-of-month" aria-labelledby="product-of-month-title">
      <div className="cinematic-shell">
        <header className="product-of-month-heading">
          <div>
            <p>{isSalesBased ? "Chosen most this month" : "The house favourite"}</p>
            <h2 id="product-of-month-title">Product of the month</h2>
          </div>
          <span>{isSalesBased ? `${unitsSold} ordered this month` : "Bestseller selection"}</span>
        </header>

        <div className="product-of-month-grid">
          <Link href={`/products/${product.handle}`} className="month-product-image month-product-image-main">
            {product.images[0] && <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 900px) 92vw, 38vw" />}
            <span>01</span>
          </Link>

          <Link href={`/products/${product.handle}`} className="month-product-image month-product-image-story">
            {secondaryImage && <Image src={secondaryImage} alt={`${product.title} campaign`} fill sizes="(max-width: 900px) 92vw, 30vw" />}
            <div>
              <small>The composition</small>
              <p>{notes.join(" · ")}</p>
            </div>
          </Link>

          <div className="month-product-copy">
            <div className="month-product-tags">
              <span>{product.details.gender}</span>
              <span>{product.details.family}</span>
              <span>{product.details.concentration}</span>
            </div>
            <h3>{product.title}</h3>
            <p>{product.description}</p>

            {selected && (
              <div className="month-product-price">
                <strong>{formatInr(selected.price)}</strong>
                {selected.compareAtPrice && <s>{formatInr(selected.compareAtPrice)}</s>}
                {discount && <span>{discount}% off</span>}
              </div>
            )}
            <small className="month-tax-note">Inclusive of all taxes</small>

            {product.variants.length > 0 && (
              <div className="month-variant-picker">
                <b>Choose a size</b>
                <div>
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={variant.id === selectedVariantId ? "is-selected" : undefined}
                      onClick={() => setSelectedVariantId(variant.id)}
                    >
                      {formatSize(variant.sizeMl, variant.sizeLabel)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="month-product-actions">
              <button type="button" onClick={addToBag} disabled={!selected}>Add to bag</button>
              <Link href={`/products/${product.handle}`}>View details <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
