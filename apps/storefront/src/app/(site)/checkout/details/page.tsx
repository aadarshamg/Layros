"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { saveCheckoutDetails } from "@/lib/checkout-storage";
import type { CheckoutDetailsFormData } from "@leyros/types";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export default function CheckoutDetailsPage() {
  const router = useRouter();
  const { items, isReady } = useCart();
  const { customer } = useAuth();
  const savedAddress = customer?.defaultShippingAddress;
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [fullName, setFullName] = useState(savedAddress?.fullName ?? "");
  const [addressLine1, setAddressLine1] = useState(savedAddress?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(savedAddress?.addressLine2 ?? "");
  const [city, setCity] = useState(savedAddress?.city ?? "");
  const [state, setState] = useState(savedAddress?.state ?? INDIAN_STATES[0]);
  const [postalCode, setPostalCode] = useState(savedAddress?.postalCode ?? "");
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [pinLookupFailed, setPinLookupFailed] = useState(false);

  // GoKwik-style address autofill: India's PIN codes map 1:1 to a district
  // and state, so once someone finishes typing a valid 6-digit PIN there's
  // no real reason to also make them type City and State by hand. Uses
  // India Post's free public lookup — no key, no vendor account needed.
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

  if (isReady && items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-charcoal-soft/70">Your cart is empty, add something before checking out.</p>
        <Link href="/collections/all" className="mt-6 inline-block rounded-full border border-charcoal px-8 py-3 text-sm uppercase tracking-widest hover:bg-charcoal hover:text-offwhite">
          Continue shopping
        </Link>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data: CheckoutDetailsFormData = {
      email,
      phone: phone || undefined,
      createAccount: false,
      shippingAddress: {
        fullName,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state: state ?? "",
        postalCode,
        country: "IN",
      },
      shippingMethodId: "standard",
      giftWrap: giftWrapEnabled ? { enabled: true, message: giftMessage || undefined } : undefined,
      newsletterOptIn,
    };
    saveCheckoutDetails(data);
    router.push("/checkout/payment");
  }

  return (
    <div className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-heading">
          <p>Checkout · Step 1 of 2</p>
          <h1>Where should we send it?</h1>
          <span>Fast checkout, secure payment, and delivery updates by phone.</span>
          <div className="checkout-steps"><i className="active" /><i /></div>
        </header>
      <form onSubmit={handleSubmit} className="checkout-card space-y-6 text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">Phone</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2" placeholder="For delivery updates" />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">Full name</span>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2" />
        </label>

        <label className="block">
          <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">Address line 1</span>
          <input required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2" />
        </label>

        <label className="block">
          <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">Address line 2 (optional)</span>
          <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2" />
        </label>

        <label className="block">
          <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">PIN code</span>
          <input
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
            className="w-full max-w-40 rounded-xl border border-border px-3 py-2"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit PIN"
          />
          {isLookingUpPin && <span className="mt-1 block text-xs text-charcoal-soft/60">Looking up your city and state…</span>}
          {pinLookupFailed && <span className="mt-1 block text-xs text-charcoal-soft/60">Couldn&apos;t find that PIN — enter city/state below.</span>}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">City</span>
            <input required value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">State</span>
            <select required value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2">
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={giftWrapEnabled} onChange={(e) => setGiftWrapEnabled(e.target.checked)} />
          <span>Add complimentary gift wrap</span>
        </label>
        {giftWrapEnabled && (
          <textarea
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="Gift message (optional)"
            className="w-full rounded-xl border border-border px-3 py-2"
            rows={2}
          />
        )}

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} />
          <span>Keep me updated on new releases and private sales</span>
        </label>

        <button type="submit" className="w-full rounded-full bg-charcoal py-4 text-center text-sm uppercase tracking-widest text-offwhite">
          Continue to payment
        </button>
      </form>
      <div className="checkout-trust-strip"><span>✓ Secure checkout</span><span>↺ Easy returns</span><span>✦ Gift-ready packaging</span></div>
      </div>
    </div>
  );
}
