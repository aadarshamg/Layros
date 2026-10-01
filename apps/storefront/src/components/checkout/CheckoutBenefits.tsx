"use client";

import { useCart } from "@/lib/cart-context";
import { formatInr } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { CATEGORY_COUPON_OFFERS, COUPON_CATEGORY_LABELS, calculateBuyTwoGetOne, getCouponOfferCategory } from "@/lib/promotions";

export function CheckoutBenefits({ compact = false }: { compact?: boolean }) {
  const { items, subtotal, amountUntilFreeShipping, hasFreeShipping } = useCart();
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const categories = Array.from(new Set(items.map((item) => getCouponOfferCategory(item.category, item.title)).filter(Boolean)));
  const fragranceProgress = calculateBuyTwoGetOne(items);

  return (
    <section className={`checkout-benefits${compact ? " is-compact" : ""}`} aria-label="Shipping and available offers">
      <div className="checkout-shipping-copy">
        <strong>{hasFreeShipping ? "Free Shipping unlocked" : `Add ${formatInr(amountUntilFreeShipping)} for Free Shipping`}</strong>
        <span>{formatInr(FREE_SHIPPING_THRESHOLD)} order value</span>
      </div>
      <div className="checkout-shipping-track" aria-label={`${Math.round(progress)}% toward free shipping`}>
        <span style={{ width: `${progress}%` }} />
        <i aria-hidden="true">🚚</i>
      </div>
      <div className="checkout-benefit-offers">
        {categories.flatMap((category) => category ? CATEGORY_COUPON_OFFERS[category].map((offer) => (
          <div key={offer.code}><b>{offer.percent}% OFF</b><span>{COUPON_CATEGORY_LABELS[category]} · {formatInr(offer.minimum)}+</span></div>
        )) : [])}
        {fragranceProgress.eligibleItemCount > 0 && (
          <div><b>Buy 2 Get 1 Free</b><span>{fragranceProgress.freeItemCount ? `${fragranceProgress.freeItemCount} free item unlocked` : `${3 - (fragranceProgress.eligibleItemCount % 3)} more eligible fragrance${3 - (fragranceProgress.eligibleItemCount % 3) === 1 ? "" : "s"}`}</span></div>
        )}
      </div>
    </section>
  );
}
