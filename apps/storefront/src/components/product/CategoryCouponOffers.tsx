"use client";

import { useState } from "react";
import { CATEGORY_COUPON_OFFERS, COUPON_CATEGORY_LABELS, type CouponOfferCategory } from "@/lib/promotions";
import { formatInr } from "@/lib/format";

export function CategoryCouponOffers({ category }: { category: CouponOfferCategory }) {
  const [copied, setCopied] = useState<string | null>(null);
  const offers = CATEGORY_COUPON_OFFERS[category];

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="category-coupon-offers" aria-labelledby="category-coupon-title">
      <header>
        <span>Exclusive category savings</span>
        <h2 id="category-coupon-title">Offers on {COUPON_CATEGORY_LABELS[category]}</h2>
        <p>Choose the coupon that matches your eligible category subtotal.</p>
      </header>
      <div className="category-coupon-list">
        {offers.map((offer) => (
          <article key={offer.code}>
            <div><strong>{offer.percent}% OFF</strong><span>on {formatInr(offer.minimum)}+</span></div>
            <button type="button" onClick={() => copyCode(offer.code)} aria-label={`Copy coupon code ${offer.code}`}>
              <small>{copied === offer.code ? "Copied" : "Use code"}</small>
              <b>{offer.code}</b>
            </button>
          </article>
        ))}
      </div>
      <p className="category-coupon-note">Valid only on {COUPON_CATEGORY_LABELS[category]}. Perfumes and Attars use the separate Buy 2, Get 1 Free promotion.</p>
    </section>
  );
}
