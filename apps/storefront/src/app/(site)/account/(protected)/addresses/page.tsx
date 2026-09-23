"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export default function AddressesPage() {
  const { customer } = useAuth();
  const saved = customer?.defaultShippingAddress;
  const [fullName, setFullName] = useState(saved?.fullName ?? "");
  const [addressLine1, setAddressLine1] = useState(saved?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(saved?.addressLine2 ?? "");
  const [city, setCity] = useState(saved?.city ?? "");
  const [state, setState] = useState(saved?.state ?? INDIAN_STATES[0]);
  const [postalCode, setPostalCode] = useState(saved?.postalCode ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultShippingAddress: { fullName, addressLine1, addressLine2: addressLine2 || undefined, city, state, postalCode, country: "IN" },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Could not save your address.");
      }
      setMessage("Address saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your address.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 text-sm">
      <p className="text-charcoal-soft/70">Saved as your default delivery address — pre-fills checkout next time.</p>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">PIN code</span>
          <input
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-border px-3 py-2"
            inputMode="numeric"
            maxLength={6}
          />
        </label>
        <label className="block">
          <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">City</span>
          <input required value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">State</span>
        <select required value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2">
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSaving} className="rounded-full bg-charcoal px-8 py-3 text-xs uppercase tracking-widest text-offwhite disabled:opacity-60">
        {isSaving ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
