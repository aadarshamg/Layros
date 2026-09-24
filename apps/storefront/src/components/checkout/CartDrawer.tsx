"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatInr, formatSize } from "@/lib/format";
import { CartLoginStep } from "@/components/checkout/CartLoginStep";
import { CartAddressStep } from "@/components/checkout/CartAddressStep";
import { CartPaymentStep } from "@/components/checkout/CartPaymentStep";
import { CouponWidget } from "@/components/checkout/CouponWidget";
import { CouponCelebration } from "@/components/checkout/CouponCelebration";
import { RECENT_PRODUCT_STORAGE_KEY } from "@/components/product/ProductInterestTracker";
import { DEFAULT_CART_PROMO_BANNER, DEFAULT_TRUST_BADGE_TEXT } from "@/lib/site-defaults";
import type { CheckoutDetailsFormData } from "@leyros/types";

interface SuggestedVariant {
  id: string;
  sku: string;
  sizeMl: number;
  sizeLabel?: string;
  price: number;
  compareAtPrice?: number;
}

interface SuggestedProduct {
  id: string;
  handle: string;
  title: string;
  image?: string;
  variant: SuggestedVariant | null;
}

function discountPercent(price: number, compareAtPrice?: number) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

interface StoreSettings {
  rewardEnabled: boolean;
  rewardThreshold?: number;
  rewardDescription?: string;
  cartPromoBanner?: string;
  trustBadgeText?: string;
}

export function CartDrawer() {
  const {
    items,
    subtotal,
    mrpSavings,
    appliedCoupon,
    couponDiscount,
    total,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    addItem,
  } = useCart();
  const { isLoggedIn, customer } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({ rewardEnabled: false });
  type DrawerView = "cart" | "login" | "address" | "payment";
  const [view, setView] = useState<DrawerView>("cart");
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetailsFormData | null>(null);

  useEffect(() => {
    if (!isDrawerOpen) return;
    document.body.style.overflow = "hidden";
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    fetch("/api/store-settings")
      .then((response) => response.json())
      .then((data) => setStoreSettings(data))
      .catch(() => setStoreSettings({ rewardEnabled: false }));
  }, [isDrawerOpen]);

  const cartProductIdKey = [...new Set(items.map((item) => item.productId))].sort().join(",");

  useEffect(() => {
    if (!isDrawerOpen) return;
    const cartProductIds = cartProductIdKey ? cartProductIdKey.split(",") : [];
    let interestProductIds: string[] = [];
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_PRODUCT_STORAGE_KEY) ?? "[]");
      if (Array.isArray(stored)) {
        interestProductIds = stored.filter((id): id is string => typeof id === "string").slice(0, 20);
      }
    } catch {
      interestProductIds = [];
    }
    fetch("/api/products/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartProductIds, interestProductIds }),
    })
      .then((response) => response.json())
      .then((data) => setSuggestions(data.products ?? []))
      .catch(() => setSuggestions([]));
  }, [isDrawerOpen, cartProductIdKey]);

  if (!isDrawerOpen) return null;

  const cartProductIds = new Set(items.map((item) => item.productId));
  const crossSell = suggestions.filter((product) => !cartProductIds.has(product.id)).slice(0, 10);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const rewardTarget = storeSettings.rewardThreshold ?? 0;
  const rewardRemaining = Math.max(0, rewardTarget - subtotal);
  const rewardProgress = rewardTarget > 0 ? Math.min(100, (subtotal / rewardTarget) * 100) : 0;
  const totalSavings = mrpSavings + couponDiscount;

  function handleQuickAdd(product: SuggestedProduct) {
    if (!product.variant) return;
    addItem({
      productId: product.id,
      handle: product.handle,
      variantId: product.variant.id,
      title: product.title,
      image: product.image,
      sizeMl: product.variant.sizeMl,
      sizeLabel: product.variant.sizeLabel,
      sku: product.variant.sku,
      unitPrice: product.variant.price,
      compareAtPrice: product.variant.compareAtPrice,
      quantity: 1,
    });
  }

  // Resumes wherever they left off: once delivery details exist (guest or
  // logged-in), skip straight back to payment rather than re-asking. A
  // logged-in customer with a saved address and email on file skips the
  // address step entirely on their very first click.
  function startCheckout() {
    if (checkoutDetails) {
      setView("payment");
      return;
    }
    if (!isLoggedIn) {
      setView("login");
      return;
    }
    if (customer?.defaultShippingAddress && customer.email) {
      setCheckoutDetails({
        email: customer.email,
        phone: customer.phone,
        createAccount: false,
        shippingAddress: customer.defaultShippingAddress,
        shippingMethodId: "standard",
        newsletterOptIn: true,
      });
      setView("payment");
      return;
    }
    setView("address");
  }

  return (
    <div className="cart-overlay" onClick={closeDrawer} role="presentation">
      <aside
        className="cart-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <CouponCelebration />
        <header className="cart-drawer-header">
          <div>
            <h2 id="cart-drawer-title">
              {view === "cart" ? <>Your Cart <small>({totalItemCount} {totalItemCount === 1 ? "item" : "items"})</small></> : "Checkout"}
            </h2>
          </div>
          <button type="button" onClick={closeDrawer} aria-label="Close cart" className="cart-close">×</button>
        </header>

        {view === "cart" && items.length > 0 && (
          <div className="cart-promo-banner">{storeSettings.cartPromoBanner || DEFAULT_CART_PROMO_BANNER}</div>
        )}

        {view === "cart" && items.length > 0 && storeSettings.rewardEnabled && rewardTarget > 0 && (
          <section className={`cart-reward ${rewardRemaining === 0 ? "is-unlocked" : ""}`} aria-label="Order reward progress">
            <div className="cart-reward-copy">
              <b>{rewardRemaining > 0 ? `${formatInr(rewardRemaining)} away from your complimentary rewards` : "Your complimentary rewards are unlocked"}</b>
            </div>
            <div className="cart-progress" aria-hidden="true"><span style={{ width: `${rewardProgress}%` }} /></div>
            <div className="cart-reward-scale">
              <span>{rewardRemaining === 0 ? "Reward unlocked" : `${formatInr(subtotal)} in your bag`}</span>
              <span>{formatInr(rewardTarget)} goal</span>
            </div>
          </section>
        )}

        <div className="cart-drawer-scroll">
          {view === "login" && (
            <CartLoginStep
              onBack={() => setView("cart")}
              // CartAddressStep reads the just-refreshed customer itself and
              // shows the saved-address summary (with a one-tap "Deliver
              // here" straight to payment) whenever one exists — no need to
              // branch here on a customer value that may not have re-rendered yet.
              onLoggedIn={() => setView("address")}
              onGuest={() => setView("address")}
            />
          )}
          {view === "address" && (
            <CartAddressStep
              initialDetails={checkoutDetails}
              onBack={() => setView(isLoggedIn ? "cart" : "login")}
              onContinue={(nextDetails) => {
                setCheckoutDetails(nextDetails);
                setView("payment");
              }}
            />
          )}
          {view === "payment" && checkoutDetails && (
            <CartPaymentStep
              details={checkoutDetails}
              onBack={() => setView("address")}
              onChangeAddress={() => setView("address")}
              onDone={() => {
                setCheckoutDetails(null);
                setView("cart");
                closeDrawer();
              }}
            />
          )}
          {view === "cart" && (items.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-mark">L</span>
              <h3>Your bag is waiting</h3>
              <p>Discover a signature scent, handcrafted candle, or a thoughtful Leyros gift.</p>
              <Link href="/collections/all" onClick={closeDrawer}>Explore the collection</Link>
            </div>
          ) : (
            <>
              <ul className="cart-lines">
                {items.map((item) => {
                  const discount = discountPercent(item.unitPrice, item.compareAtPrice);
                  return (
                    <li key={item.id} className="cart-line">
                      <Link href={`/products/${item.handle}`} onClick={closeDrawer} className="cart-line-image">
                        {item.image && <Image src={item.image} alt={item.title} fill sizes="92px" />}
                      </Link>
                      <div className="cart-line-content">
                        <div className="cart-line-heading">
                          <div>
                            <Link href={`/products/${item.handle}`} onClick={closeDrawer}>{item.title}</Link>
                            <p>{formatSize(item.sizeMl, item.sizeLabel)}</p>
                          </div>
                          <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title}`}>Remove</button>
                        </div>
                        <div className="cart-line-bottom">
                          <div className="cart-quantity" aria-label={`Quantity for ${item.title}`}>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                            <span aria-live="polite">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                          </div>
                          <div className="cart-line-price">
                            <strong>{formatInr(item.unitPrice * item.quantity)}</strong>
                            {item.compareAtPrice && item.compareAtPrice > item.unitPrice && (
                              <small><s>{formatInr(item.compareAtPrice * item.quantity)}</s>{discount}% off</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <CouponWidget />

              {crossSell.length > 0 && (
                <section className="cart-recommendations" aria-labelledby="cart-recommendations-title">
                  <div className="cart-section-heading">
                    <h3 id="cart-recommendations-title">You Might Also Like</h3>
                  </div>
                  <div className="cart-recommendation-track">
                    {crossSell.map((product) => {
                      const discount = product.variant ? discountPercent(product.variant.price, product.variant.compareAtPrice) : null;
                      return (
                        <article className="cart-recommendation" key={product.id}>
                          <Link href={`/products/${product.handle}`} onClick={closeDrawer} className="cart-recommendation-image">
                            {product.image && <Image src={product.image} alt={product.title} fill sizes="170px" />}
                          </Link>
                          <div className="cart-recommendation-copy">
                            <Link href={`/products/${product.handle}`} onClick={closeDrawer}>{product.title}</Link>
                            {product.variant && (
                              <p><b>{formatInr(product.variant.price)}</b>{discount && <span>{discount}% off</span>}</p>
                            )}
                            <button type="button" onClick={() => handleQuickAdd(product)} disabled={!product.variant}>+ Add</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="cart-trust-marquee" aria-hidden="true">
                <div className="cart-trust-marquee-track">
                  {Array.from({ length: 4 }, (_, i) => (
                    <span key={i}>✦ {storeSettings.trustBadgeText || DEFAULT_TRUST_BADGE_TEXT}</span>
                  ))}
                </div>
              </div>
            </>
          ))}
        </div>

        {view === "cart" && items.length > 0 && (
          <footer className="cart-drawer-footer">
            {totalSavings > 0 && <div className="cart-savings">You save {formatInr(totalSavings)} on this order</div>}
            <div className="cart-total-row"><span><b>Estimated total</b><small>Taxes included</small></span><strong>{formatInr(total)}</strong></div>
            {/* Snapmint isn't wired up for real checkout yet — informational only until merchant details are shared. */}
            <p className="cart-snapmint">
              <span className="cart-snapmint-tag">NEW</span>
              or Pay <b>{formatInr(Math.round(total / 3))}</b> now, rest later by <span className="cart-snapmint-brand">snapmint</span>
              <span className="cart-snapmint-plans">View Plans</span>
            </p>
            <button type="button" onClick={startCheckout} className="cart-checkout">
              <span className="cart-checkout-copy"><b>Checkout</b><small>Cards, UPI &amp; secure payment</small></span>
              <span className="cart-checkout-payment-icons" aria-hidden="true">
                <span className="pay-chip pay-chip-gpay">G Pay</span>
                <span className="pay-chip pay-chip-phonepe">PhonePe</span>
                <span className="pay-chip pay-chip-paytm">Paytm</span>
              </span>
              <span className="cart-checkout-arrow" aria-hidden="true">→</span>
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
