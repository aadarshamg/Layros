"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { CartOrderSummaryMini } from "@/components/checkout/CartOrderSummaryMini";
import { CouponWidget } from "@/components/checkout/CouponWidget";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import { WhatsAppOptIn } from "@/components/checkout/WhatsAppOptIn";

type Step = "phone" | "code";

export function CartLoginStep({ onBack, onLoggedIn, onGuest }: { onBack: () => void; onLoggedIn: () => void; onGuest: () => void }) {
  const { requestOtp, verifyOtp, isLoading } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleRequestOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    try {
      await requestOtp(phone);
      setStep("code");
      setInfo(`We've sent a 6-digit code to +91 ${phone}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await verifyOtp(phone, code);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is incorrect.");
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    try {
      await requestOtp(phone);
      setInfo(`We've sent a new code to +91 ${phone}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    }
  }

  return (
    <div className="cart-step">
      <div className="cart-step-header">
        <button type="button" onClick={onBack} className="cart-step-back">← Back to bag</button>
      </div>
      <h3 className="cart-step-title">Log in to check out faster</h3>
      <p className="cart-step-subtitle">No password needed — we&apos;ll text you a one-time code.</p>

      <CartOrderSummaryMini />
      <CouponWidget />

      {step === "phone" && (
        <form onSubmit={handleRequestOtp} className="cart-step-form">
          <label className="cart-step-field">
            <span>Phone number</span>
            <div className="cart-step-phone-input">
              <span>+91</span>
              <input
                type="tel"
                required
                autoFocus
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="98765 43210"
              />
            </div>
          </label>
          <WhatsAppOptIn />
          {error && <p className="cart-step-error">{error}</p>}
          <button type="submit" disabled={isLoading} className="cart-step-primary-button">
            {isLoading ? "Sending…" : "Send code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyOtp} className="cart-step-form">
          {info && <p className="cart-step-info">{info}</p>}
          <label className="cart-step-field">
            <span>6-digit code</span>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="cart-step-otp-input"
              placeholder="••••••"
            />
          </label>
          {error && <p className="cart-step-error">{error}</p>}
          <button type="submit" disabled={isLoading} className="cart-step-primary-button">
            {isLoading ? "Verifying…" : "Verify and continue"}
          </button>
          <div className="cart-step-links">
            <button type="button" onClick={() => setStep("phone")}>Change number</button>
            <button type="button" onClick={handleResend}>Resend code</button>
          </div>
        </form>
      )}

      <div className="cart-step-divider"><span>or</span></div>
      <button type="button" onClick={onGuest} className="cart-step-secondary-button">Continue as guest</button>

      <TrustBadges />
      <p className="cart-step-terms">
        By continuing, you agree to our <a href="/legal/terms" target="_blank" rel="noreferrer">Terms</a> &amp; <a href="/legal/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
      </p>
    </div>
  );
}
