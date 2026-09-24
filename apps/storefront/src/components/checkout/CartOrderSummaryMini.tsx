"use client";

import { useCart } from "@/lib/cart-context";
import { formatInr, formatSize } from "@/lib/format";

/** Collapsible order recap shown on the login/address checkout steps, so the bag stays visible without switching back to the cart view. */
export function CartOrderSummaryMini() {
  const { items, itemCount, subtotal, mrpSavings, appliedCoupon, couponDiscount, total } = useCart();
  if (items.length === 0) return null;

  return (
    <details className="order-summary-mini">
      <summary>
        <span aria-hidden="true">🛍</span>
        <span>Order summary</span>
        <small>{itemCount} {itemCount === 1 ? "item" : "items"}</small>
        <strong>{formatInr(total)}</strong>
      </summary>
      <div className="order-summary-mini-body">
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.title} ({formatSize(item.sizeMl, item.sizeLabel)}) × {item.quantity}</span>
              <span>{formatInr(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="order-summary-mini-totals">
          <div><span>Subtotal</span><span>{formatInr(subtotal)}</span></div>
          {mrpSavings > 0 && <div className="is-discount"><span>MRP savings</span><span>−{formatInr(mrpSavings)}</span></div>}
          {appliedCoupon && couponDiscount > 0 && (
            <div className="is-discount"><span>Coupon ({appliedCoupon.code})</span><span>−{formatInr(couponDiscount)}</span></div>
          )}
          <div className="is-total"><span>Total</span><span>{formatInr(total)}</span></div>
        </div>
      </div>
    </details>
  );
}
