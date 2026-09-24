"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatInr } from "@/lib/format";
import { CartOrderSummaryMini } from "@/components/checkout/CartOrderSummaryMini";
import type { CheckoutDetailsFormData } from "@leyros/types";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type PaymentMethod = "razorpay" | "cod";

export function CartPaymentStep({
  details,
  onBack,
  onChangeAddress,
  onDone,
}: {
  details: CheckoutDetailsFormData;
  onBack: () => void;
  onChangeAddress: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { items, appliedCoupon, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  function cartItemsPayload() {
    return items.map((item) => ({
      variantId: item.variantId,
      sku: item.sku,
      title: item.title,
      sizeMl: item.sizeMl,
      sizeLabel: item.sizeLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    }));
  }

  async function handlePayOnline() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItemsPayload(), details, couponCode: appliedCoupon?.code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Leyros",
        description: "Leyros fragrance order",
        prefill: {
          name: details.shippingAddress.fullName,
          email: details.email,
          contact: details.phone,
        },
        theme: { color: "#1a1a1a" },
        handler: async (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyResponse = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...paymentResponse, items: cartItemsPayload(), details, couponCode: appliedCoupon?.code }),
          });
          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) {
            setError("Payment could not be verified. If money was deducted, contact us with your payment ID.");
            setIsSubmitting(false);
            return;
          }
          clearCart();
          onDone();
          router.push(`/checkout/confirmation?order=${verifyData.orderNumber ?? paymentResponse.razorpay_order_id}`);
        },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
      });
      razorpay.open();
    } catch {
      setError("Could not start checkout. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handlePlaceCodOrder() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checkout/create-cod-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItemsPayload(), details, couponCode: appliedCoupon?.code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not place your order. Please try again.");
        setIsSubmitting(false);
        return;
      }
      clearCart();
      onDone();
      router.push(`/checkout/confirmation?order=${data.orderNumber}&cod=1`);
    } catch {
      setError("Could not place your order. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="cart-step">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayReady(true)} />
      <div className="cart-step-header">
        <button type="button" onClick={onBack} className="cart-step-back">← Back</button>
      </div>
      <h3 className="cart-step-title">Choose how you&apos;ll pay</h3>

      <div className="cart-saved-address">
        <div className="cart-step-field-row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <b>Delivering to</b>
          <button type="button" onClick={onChangeAddress} className="cart-step-link-button">Change</button>
        </div>
        <p>{details.shippingAddress.fullName}</p>
        <p>{details.shippingAddress.addressLine1}</p>
        {details.shippingAddress.addressLine2 && <p>{details.shippingAddress.addressLine2}</p>}
        <p>{details.shippingAddress.city}, {details.shippingAddress.state} {details.shippingAddress.postalCode}</p>
      </div>

      <CartOrderSummaryMini />

      <div className="cart-saved-address">
        <b>Payment method</b>
        <label className={`cart-payment-option ${paymentMethod === "razorpay" ? "is-selected" : ""}`}>
          <input type="radio" name="paymentMethod" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} />
          <span><b>Pay Online</b><small>Cards, UPI, netbanking via Razorpay</small></span>
        </label>
        {isLoggedIn ? (
          <label className={`cart-payment-option ${paymentMethod === "cod" ? "is-selected" : ""}`}>
            <input type="radio" name="paymentMethod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
            <span><b>Cash on Delivery</b><small>Pay in cash when your order arrives</small></span>
          </label>
        ) : (
          <p className="cart-step-note">Log in to unlock Cash on Delivery.</p>
        )}
      </div>

      <label className="cart-step-checkbox">
        <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
        <span>
          I agree to the <a href="/legal/terms" target="_blank" rel="noreferrer">Terms</a> and{" "}
          <a href="/legal/shipping-returns" target="_blank" rel="noreferrer">Shipping &amp; Returns</a> policy.
        </span>
      </label>

      {error && <p className="cart-step-error">{error}</p>}
      {!acceptedTerms && <p className="cart-step-note">Accept the Terms and Shipping &amp; Returns policy to continue.</p>}
      {acceptedTerms && paymentMethod === "razorpay" && !razorpayReady && (
        <p className="cart-step-note">Loading secure payment…</p>
      )}

      {paymentMethod === "razorpay" ? (
        <button
          type="button"
          onClick={handlePayOnline}
          disabled={!acceptedTerms || !razorpayReady || isSubmitting}
          className="cart-step-primary-button"
        >
          {isSubmitting ? "Processing…" : `Pay ${formatInr(total)}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePlaceCodOrder}
          disabled={!acceptedTerms || isSubmitting}
          className="cart-step-primary-button"
        >
          {isSubmitting ? "Placing order…" : `Place order · ${formatInr(total)} (COD)`}
        </button>
      )}
    </div>
  );
}
