"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatInr } from "@/lib/format";

/** Coupon entry/applied-state, shared across the cart drawer and every checkout step — same look everywhere. */
export function CouponWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { appliedCoupon, couponDiscount, couponError, isApplyingCoupon, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");

  function handleApply(event: React.FormEvent) {
    event.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput.trim());
  }

  return (
    <details className={`cart-coupon coupon-widget ${appliedCoupon ? "is-applied" : ""}`} open={defaultOpen || Boolean(appliedCoupon)}>
      <summary>
        <span className="coupon-widget-tag" aria-hidden="true">%</span>
        <span className="coupon-widget-summary-text"><b>{appliedCoupon ? `${appliedCoupon.code} applied — saved ${formatInr(couponDiscount)}!` : "Offers & coupon code"}</b><small>{appliedCoupon ? "Tap to manage" : "View available savings"}</small></span>
        <span className="coupon-widget-chevron" aria-hidden="true">+</span>
      </summary>
      <div className="cart-coupon-body">
        {appliedCoupon ? (
          <div className="cart-coupon-applied">
            <span><b>{appliedCoupon.code}</b> saved {formatInr(couponDiscount)}</span>
            <button type="button" onClick={removeCoupon}>Remove</button>
          </div>
        ) : (
          <form onSubmit={handleApply}>
            <input type="text" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter coupon code" aria-label="Coupon code" />
            <button type="submit" disabled={isApplyingCoupon || !couponInput.trim()}>{isApplyingCoupon ? "Checking…" : "Apply"}</button>
          </form>
        )}
        {couponError && !appliedCoupon && <p className="cart-coupon-error">{couponError}</p>}
      </div>
    </details>
  );
}
