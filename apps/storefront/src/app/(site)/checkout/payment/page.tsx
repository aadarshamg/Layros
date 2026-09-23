"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { loadCheckoutDetails, clearCheckoutDetails } from "@/lib/checkout-storage";
import { formatSize } from "@/lib/format";
import type { CheckoutDetailsFormData } from "@leyros/types";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type PaymentMethod = "razorpay" | "cod";

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { items, subtotal, mrpSavings, appliedCoupon, couponDiscount, total, isReady, clearCart } = useCart();
  const [details, setDetails] = useState<CheckoutDetailsFormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    const stored = loadCheckoutDetails();
    if (!stored) {
      router.replace("/checkout/details");
      return;
    }
    setDetails(stored);
  }, [router]);

  if (isReady && items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-charcoal-soft/70">Your cart is empty.</p>
      </div>
    );
  }

  if (!details) return null;

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
    if (!details) return;
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
          clearCheckoutDetails();
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
    if (!details) return;
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
      clearCheckoutDetails();
      router.push(`/checkout/confirmation?order=${data.orderNumber}&cod=1`);
    } catch {
      setError("Could not place your order. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-shell">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayReady(true)} />
      <header className="checkout-heading">
        <p>Checkout · Step 2 of 2</p>
        <h1>Choose how you’ll pay</h1>
        <span>Your payment details stay encrypted and protected.</span>
        <div className="checkout-steps"><i className="active" /><i className="active" /></div>
      </header>

      <div className="checkout-card mt-8 rounded-2xl border border-border p-6 text-sm">
        <p className="mb-4 font-medium uppercase tracking-widest">Delivering to</p>
        <p>{details.shippingAddress.fullName}</p>
        <p>{details.shippingAddress.addressLine1}</p>
        {details.shippingAddress.addressLine2 && <p>{details.shippingAddress.addressLine2}</p>}
        <p>
          {details.shippingAddress.city}, {details.shippingAddress.state} {details.shippingAddress.postalCode}
        </p>
        <p>{details.email}</p>
      </div>

      <div className="checkout-card mt-6 rounded-2xl border border-border p-6 text-sm">
        <p className="mb-4 font-medium uppercase tracking-widest">Order summary</p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.title} ({formatSize(item.sizeMl, item.sizeLabel)}) × {item.quantity}
              </span>
              <span>{formatInr(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-3">
          <div className="flex justify-between text-charcoal-soft/70">
            <span>Subtotal</span>
            <span>{formatInr(subtotal)}</span>
          </div>
          {mrpSavings > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>MRP savings</span>
              <span>−{formatInr(mrpSavings)}</span>
            </div>
          )}
          {appliedCoupon && couponDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Coupon ({appliedCoupon.code})</span>
              <span>−{formatInr(couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatInr(total)}</span>
          </div>
        </div>
      </div>

      <div className="checkout-card mt-6 rounded-2xl border border-border p-6 text-sm">
        <p className="mb-4 font-medium uppercase tracking-widest">Payment method</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === "razorpay" ? "border-charcoal" : "border-border"}`}>
            <input type="radio" name="paymentMethod" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} />
            <span>
              <span className="block font-medium">Pay Online</span>
              <span className="block text-xs text-charcoal-soft/60">Cards, UPI, netbanking via Razorpay</span>
            </span>
          </label>
          {isLoggedIn ? (
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === "cod" ? "border-charcoal" : "border-border"}`}>
              <input type="radio" name="paymentMethod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
              <span>
                <span className="block font-medium">Cash on Delivery</span>
                <span className="block text-xs text-charcoal-soft/60">Pay in cash when your order arrives</span>
              </span>
            </label>
          ) : (
            <p className="flex items-center rounded-xl border border-dashed border-border p-4 text-xs text-charcoal-soft/60">
              Log in to unlock Cash on Delivery.
            </p>
          )}
        </div>
      </div>

      <label className="checkout-terms mt-6 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1" />
        <span>
          I agree to the{" "}
          <a href="/legal/terms" className="underline" target="_blank" rel="noreferrer">
            Terms
          </a>{" "}
          and{" "}
          <a href="/legal/shipping-returns" className="underline" target="_blank" rel="noreferrer">
            Shipping &amp; Returns
          </a>{" "}
          policy.
        </span>
      </label>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {!acceptedTerms && <p className="mt-3 text-xs text-charcoal-soft/60">Accept the Terms and Shipping &amp; Returns policy to continue.</p>}
      {acceptedTerms && paymentMethod === "razorpay" && !razorpayReady && (
        <p className="mt-3 text-xs text-charcoal-soft/60">Loading secure payment…</p>
      )}

      {paymentMethod === "razorpay" ? (
        <button
          type="button"
          onClick={handlePayOnline}
          disabled={!acceptedTerms || !razorpayReady || isSubmitting}
          className="checkout-payment-button mt-6 w-full rounded-full py-4 text-center text-sm uppercase tracking-widest text-offwhite"
        >
          {isSubmitting ? "Processing…" : `Pay ${formatInr(total)}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePlaceCodOrder}
          disabled={!acceptedTerms || isSubmitting}
          className="checkout-payment-button mt-6 w-full rounded-full py-4 text-center text-sm uppercase tracking-widest text-offwhite"
        >
          {isSubmitting ? "Placing order…" : `Place order · ${formatInr(total)} (Cash on Delivery)`}
        </button>
      )}
      <div className="checkout-trust-strip"><span>✓ Secure checkout</span><span>↺ Easy returns</span><span>✦ Gift-ready packaging</span></div>
      </div>
    </div>
  );
}
