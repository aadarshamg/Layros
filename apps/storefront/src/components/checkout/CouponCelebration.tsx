"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { formatInr } from "@/lib/format";

/** Brief celebratory overlay shown right after a coupon is successfully applied — auto-dismisses, or tap through. */
export function CouponCelebration() {
  const { showCouponCelebration, dismissCouponCelebration, appliedCoupon, mrpSavings, couponDiscount } = useCart();

  useEffect(() => {
    if (!showCouponCelebration) return;
    const timer = window.setTimeout(dismissCouponCelebration, 2600);
    return () => window.clearTimeout(timer);
  }, [showCouponCelebration, dismissCouponCelebration]);

  if (!showCouponCelebration) return null;

  const totalSavings = mrpSavings + couponDiscount;

  return (
    <div className="coupon-celebration-overlay" onClick={dismissCouponCelebration} role="presentation">
      <div className="coupon-celebration-card" onClick={(event) => event.stopPropagation()}>
        <span className="coupon-celebration-badge" aria-hidden="true">%</span>
        <h3>Woohoo!</h3>
        {appliedCoupon && <p className="coupon-celebration-code">{appliedCoupon.code} applied</p>}
        <div className="coupon-celebration-divider" />
        <p className="coupon-celebration-label">Total savings</p>
        <p className="coupon-celebration-amount">{formatInr(totalSavings)}</p>
        <button type="button" onClick={dismissCouponCelebration} className="coupon-celebration-button">Awesome</button>
      </div>
    </div>
  );
}
