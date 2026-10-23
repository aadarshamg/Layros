"use client";

import Image from "@/components/SiteImage";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatInr, formatSize } from "@/lib/format";
import { calculateBuyTwoGetOne } from "@/lib/promotions";

export interface BoxProduct {
  productId: string;
  handle: string;
  title: string;
  name: string;
  category?: string;
  image: string;
  variant: { id: string; sku: string; sizeMl: number; sizeLabel?: string; price: number; compareAtPrice?: number };
}

const BOX_SIZE = 3;

export function BoxBuilder({ products }: { products: BoxProduct[] }) {
  const { addItem } = useCart();
  const [picked, setPicked] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const chosen = picked.map((id) => products.find((product) => product.productId === id)).filter((product): product is BoxProduct => Boolean(product));
  // The same rule the bag and checkout use, so the box total is what they'll show.
  const { discountAmount } = calculateBuyTwoGetOne(chosen.map((product) => ({ title: product.title, category: product.category, unitPrice: product.variant.price, quantity: 1 })));
  const total = chosen.reduce((sum, product) => sum + product.variant.price, 0);
  const full = chosen.length === BOX_SIZE;

  function toggle(productId: string) {
    setAdded(false);
    setPicked((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : current.length < BOX_SIZE ? [...current, productId] : current));
  }

  function addBox() {
    for (const product of chosen) {
      addItem({
        productId: product.productId,
        handle: product.handle,
        variantId: product.variant.id,
        title: product.title,
        category: product.category,
        image: product.image,
        sizeMl: product.variant.sizeMl,
        sizeLabel: product.variant.sizeLabel,
        sku: product.variant.sku,
        unitPrice: product.variant.price,
        compareAtPrice: product.variant.compareAtPrice,
        quantity: 1,
      });
    }
    setPicked([]);
    setAdded(true);
  }

  return (
    <>
      <div className="box-grid">
        {products.map((product) => {
          const isPicked = picked.includes(product.productId);
          const disabled = !isPicked && full;
          return (
            <article key={product.productId} className={`box-choice${isPicked ? " is-picked" : ""}`}>
              <button type="button" className="box-choice-button" onClick={() => toggle(product.productId)} aria-pressed={isPicked} disabled={disabled}>
                <span className="box-choice-photo"><Image src={product.image} alt="" fill sizes="(max-width: 700px) 45vw, 220px" /></span>
                <span className="box-choice-name">{product.name}</span>
                <span className="box-choice-price">{formatSize(product.variant.sizeMl, product.variant.sizeLabel)} · {formatInr(product.variant.price)}</span>
                <span className="box-choice-action">{isPicked ? "✓ In your box" : disabled ? "Box is full" : "Add to box"}</span>
              </button>
              <Link href={`/products/${product.handle}`} className="box-choice-details">Details</Link>
            </article>
          );
        })}
      </div>

      <aside className="box-summary" aria-live="polite">
        <ol className="box-slots" aria-label="Your box">
          {Array.from({ length: BOX_SIZE }, (_, index) => chosen[index]).map((product, index) => (
            <li key={index} className={product ? "is-filled" : undefined}>
              {product ? <span className="box-slot-photo"><Image src={product.image} alt={product.name} fill sizes="56px" /></span> : <span className="box-slot-empty">{index + 1}</span>}
            </li>
          ))}
        </ol>
        <div className="box-summary-text">
          {added ? (
            <p><b>Added to your bag.</b> Build another box, or <Link href="/collections/all?category=collections">keep shopping</Link>.</p>
          ) : full ? (
            <p><b>{formatInr(total - discountAmount)}</b> <s>{formatInr(total)}</s> · one bottle free ({formatInr(discountAmount)} off)</p>
          ) : (
            <p>{chosen.length} of {BOX_SIZE} chosen{chosen.length ? ` · ${formatInr(total)} so far` : ""}. Pick {BOX_SIZE - chosen.length} more.</p>
          )}
        </div>
        <button type="button" className="box-add" disabled={!full} onClick={addBox}>Add box to bag</button>
      </aside>
    </>
  );
}
