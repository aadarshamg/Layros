"use client";

import { useCart } from "@/lib/cart-context";
import { formatInr, formatSize } from "@/lib/format";

/** Collapsible order recap shown throughout checkout. */
export function CartOrderSummaryMini() {
  const { items, itemCount, subtotal, mrpSavings, appliedCoupon, couponDiscount, buyTwoGetOneDiscount, buyTwoGetOneFreeItems, shippingFee, total } = useCart();
  if (items.length === 0) return null;

  return (
    <details className="order-summary-mini">
      <summary>
        <span className="order-summary-mini-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M3 5h2l1.5 10h11.8l1.7-7H6" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></svg>
        </span>
        <span>Order summary</span>
        <small>{itemCount} {itemCount === 1 ? "item" : "items"}</small>
        <span className="order-summary-mini-chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20"><path d="m5.5 7.5 4.5 4.5 4.5-4.5" /></svg>
        </span>
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
          <div><span>Total price of products</span><span>{formatInr(subtotal)}</span></div>
          {mrpSavings > 0 && <div className="is-discount"><span>MRP savings</span><span>−{formatInr(mrpSavings)}</span></div>}
          {buyTwoGetOneDiscount > 0 && (
            <div className="is-discount is-b2g1"><span>Buy 2 Get 1 Free ({buyTwoGetOneFreeItems} free)</span><span>−{formatInr(buyTwoGetOneDiscount)}</span></div>
          )}
          {appliedCoupon && couponDiscount > 0 && (
            <div className="is-discount"><span>Coupon ({appliedCoupon.code})</span><span>−{formatInr(couponDiscount)}</span></div>
          )}
          <div className={shippingFee === 0 ? "is-discount" : undefined}><span>Standard shipping</span><span>{shippingFee === 0 ? "FREE" : formatInr(shippingFee)}</span></div>
          <div className="is-total"><span>Final payable amount</span><span>{formatInr(total)}</span></div>
        </div>
      </div>
    </details>
  );
}
