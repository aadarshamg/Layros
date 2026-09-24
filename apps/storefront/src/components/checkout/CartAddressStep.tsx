"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { CartOrderSummaryMini } from "@/components/checkout/CartOrderSummaryMini";
import { CouponWidget } from "@/components/checkout/CouponWidget";
import type { CheckoutDetailsFormData } from "@leyros/types";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export function CartAddressStep({
  initialDetails,
  onBack,
  onContinue,
}: {
  initialDetails: CheckoutDetailsFormData | null;
  onBack: () => void;
  onContinue: (details: CheckoutDetailsFormData) => void;
}) {
  const { customer, isLoggedIn, refreshCustomer } = useAuth();
  const savedAddress = customer?.defaultShippingAddress;
  // A logged-in customer with a saved address gets a one-tap summary card
  // instead of the full form — "Use a different address" drops into edit mode.
  const [isEditing, setIsEditing] = useState(!savedAddress || Boolean(initialDetails));

  const seed = initialDetails?.shippingAddress;
  const [email, setEmail] = useState(initialDetails?.email ?? customer?.email ?? "");
  const [phone, setPhone] = useState(initialDetails?.phone ?? customer?.phone ?? "");
  const [fullName, setFullName] = useState(seed?.fullName ?? savedAddress?.fullName ?? "");
  const [addressLine1, setAddressLine1] = useState(seed?.addressLine1 ?? savedAddress?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(seed?.addressLine2 ?? savedAddress?.addressLine2 ?? "");
  const [city, setCity] = useState(seed?.city ?? savedAddress?.city ?? "");
  const [state, setState] = useState(seed?.state ?? savedAddress?.state ?? INDIAN_STATES[0]);
  const [postalCode, setPostalCode] = useState(seed?.postalCode ?? savedAddress?.postalCode ?? "");
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(initialDetails?.giftWrap?.enabled ?? false);
  const [giftMessage, setGiftMessage] = useState(initialDetails?.giftWrap?.message ?? "");
  const [newsletterOptIn, setNewsletterOptIn] = useState(initialDetails?.newsletterOptIn ?? true);
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [pinLookupFailed, setPinLookupFailed] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (!/^\d{6}$/.test(postalCode)) {
      setPinLookupFailed(false);
      return;
    }
    let cancelled = false;
    setIsLookingUpPin(true);
    setPinLookupFailed(false);
    fetch(`https://api.postalpincode.in/pincode/${postalCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const postOffice = data?.[0]?.PostOffice?.[0];
        if (data?.[0]?.Status === "Success" && postOffice) {
          setCity(postOffice.District);
          if (INDIAN_STATES.includes(postOffice.State)) setState(postOffice.State);
        } else {
          setPinLookupFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setPinLookupFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLookingUpPin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postalCode]);

  function buildDetails(address: NonNullable<CheckoutDetailsFormData["shippingAddress"]>, emailValue: string, phoneValue: string): CheckoutDetailsFormData {
    return {
      email: emailValue,
      phone: phoneValue || undefined,
      createAccount: false,
      shippingAddress: address,
      shippingMethodId: "standard",
      giftWrap: giftWrapEnabled ? { enabled: true, message: giftMessage || undefined } : undefined,
      newsletterOptIn,
    };
  }

  async function handleUseSavedAddress() {
    if (!savedAddress || !customer) return;
    const emailValue = customer.email ?? "";
    if (!emailValue) {
      // No email on file yet — the summary card can't collect it, so fall through to the form once.
      setIsEditing(true);
      return;
    }
    onContinue(buildDetails(savedAddress, emailValue, customer.phone));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const address = { fullName, addressLine1, addressLine2: addressLine2 || undefined, city, state: state ?? "", postalCode, country: "IN" as const };
    if (isLoggedIn) {
      setIsSavingProfile(true);
      try {
        await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, defaultShippingAddress: address }),
        });
        await refreshCustomer();
      } catch {
        // Best-effort — the order itself doesn't depend on this succeeding.
      } finally {
        setIsSavingProfile(false);
      }
    }
    onContinue(buildDetails(address, email, phone));
  }

  if (!isEditing && savedAddress) {
    return (
      <div className="cart-step">
        <div className="cart-step-header">
          <button type="button" onClick={onBack} className="cart-step-back">← Back to bag</button>
        </div>
        <h3 className="cart-step-title">Deliver to</h3>
        <CartOrderSummaryMini />
        <CouponWidget />
        <div className="cart-saved-address">
          <p><b>{savedAddress.fullName}</b></p>
          <p>{savedAddress.addressLine1}</p>
          {savedAddress.addressLine2 && <p>{savedAddress.addressLine2}</p>}
          <p>{savedAddress.city}, {savedAddress.state} {savedAddress.postalCode}</p>
          <p>+91 {customer?.phone}</p>
        </div>
        <button type="button" onClick={handleUseSavedAddress} className="cart-step-primary-button">Deliver here</button>
        <button type="button" onClick={() => setIsEditing(true)} className="cart-step-secondary-button">Use a different address</button>
      </div>
    );
  }

  return (
    <div className="cart-step">
      <div className="cart-step-header">
        <button type="button" onClick={savedAddress ? () => setIsEditing(false) : onBack} className="cart-step-back">← Back</button>
      </div>
      <h3 className="cart-step-title">Delivery details</h3>
      <CartOrderSummaryMini />
      <CouponWidget />
      <form onSubmit={handleSubmit} className="cart-step-form">
        <label className="cart-step-field">
          <span>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="cart-step-field">
          <span>Phone</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For delivery updates" />
        </label>
        <label className="cart-step-field">
          <span>Full name</span>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="cart-step-field">
          <span>Address line 1</span>
          <input required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
        </label>
        <label className="cart-step-field">
          <span>Address line 2 (optional)</span>
          <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
        </label>
        <label className="cart-step-field">
          <span>PIN code</span>
          <input
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit PIN"
          />
          {isLookingUpPin && <small>Looking up your city and state…</small>}
          {pinLookupFailed && <small>Couldn&apos;t find that PIN — enter city/state below.</small>}
        </label>
        <div className="cart-step-field-row">
          <label className="cart-step-field">
            <span>City</span>
            <input required value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="cart-step-field">
            <span>State</span>
            <select required value={state} onChange={(e) => setState(e.target.value)}>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <label className="cart-step-checkbox">
          <input type="checkbox" checked={giftWrapEnabled} onChange={(e) => setGiftWrapEnabled(e.target.checked)} />
          <span>Add complimentary gift wrap</span>
        </label>
        {giftWrapEnabled && (
          <textarea
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="Gift message (optional)"
            className="cart-step-textarea"
            rows={2}
          />
        )}
        <label className="cart-step-checkbox">
          <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} />
          <span>Keep me updated on new releases and private sales</span>
        </label>

        <button type="submit" disabled={isSavingProfile} className="cart-step-primary-button">
          {isSavingProfile ? "Saving…" : "Continue to payment"}
        </button>
      </form>
    </div>
  );
}
