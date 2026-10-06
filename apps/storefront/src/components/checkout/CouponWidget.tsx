"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatInr } from "@/lib/format";
import { CATEGORY_COUPON_OFFERS, COUPON_CATEGORY_LABELS, getCouponOfferCategory } from "@/lib/promotions";

/** Coupon entry/applied-state, shared across the cart drawer and every checkout step. */
export function CouponWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { items, appliedCoupon, couponDiscount, couponError, isApplyingCoupon, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const cartCategories = Array.from(
    new Set(items.map((item) => getCouponOfferCategory(item.category, item.title)).filter(Boolean)),
  );
  const offerCount = cartCategories.reduce((count, category) => count + (category ? CATEGORY_COUPON_OFFERS[category].length : 0), 0);

  function handleApply(event: React.FormEvent) {
    event.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput.trim());
  }

  return (
    <details className={`cart-coupon coupon-widget ${appliedCoupon ? "is-applied" : ""}`} open={defaultOpen || Boolean(appliedCoupon)}>
      <summary>
        <span className="coupon-widget-tag" aria-hidden="true">%</span>
        <span className="coupon-widget-summary-text"><b>{appliedCoupon ? `${appliedCoupon.code} applied: saved ${formatInr(couponDiscount)}!` : "Coupons"}</b><small>{appliedCoupon ? "Tap to manage" : offerCount ? `View ${offerCount} applicable offers` : "View available savings"}</small></span>
        <span className="coupon-widget-chevron" aria-hidden="true">+</span>
      </summary>
      <div className="cart-coupon-body">
        {appliedCoupon ? (
          <div className="cart-coupon-applied">
            <span><b>{appliedCoupon.code}</b> saved {formatInr(couponDiscount)}</span>
            <button type="button" onClick={removeCoupon}>Remove</button>
          </div>
        ) : (
          <>
            {cartCategories.length > 0 && (
              <div className="coupon-recommendations" aria-label="Available category coupons">
                {cartCategories.flatMap((category) => category ? CATEGORY_COUPON_OFFERS[category].map((offer) => (
                  <button key={offer.code} type="button" onClick={() => applyCoupon(offer.code)} disabled={isApplyingCoupon}>
                    <span><b>{offer.percent}% OFF</b><small>{COUPON_CATEGORY_LABELS[category]} · {formatInr(offer.minimum)}+</small></span>
                    <strong>{offer.code}</strong>
                  </button>
                )) : [])}
              </div>
            )}
            <form onSubmit={handleApply}>
              <input type="text" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter coupon code" aria-label="Coupon code" />
              <button type="submit" disabled={isApplyingCoupon || !couponInput.trim()}>{isApplyingCoupon ? "Checking…" : "Apply"}</button>
            </form>
          </>
        )}
        {couponError && !appliedCoupon && <p className="cart-coupon-error">{couponError}</p>}
      </div>
    </details>
  );
}
