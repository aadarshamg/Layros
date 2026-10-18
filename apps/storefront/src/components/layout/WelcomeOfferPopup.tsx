"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./WelcomeOfferPopup.module.css";

const SESSION_KEY = "leyros-welcome-offer-seen";

export function WelcomeOfferPopup() {
  const pathname = usePathname();
  const { isLoggedIn, loginAvailable, isLoading, requestOtp, verifyOtp, refreshCustomer } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const excluded = pathname.startsWith("/account") || pathname.startsWith("/checkout") || pathname.startsWith("/products/");

  useEffect(() => {
    // Login-to-unlock only makes sense once codes can actually be delivered.
    if (!loginAvailable || isLoggedIn || excluded || window.sessionStorage.getItem(SESSION_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), 1300);
    return () => window.clearTimeout(timer);
  }, [excluded, isLoggedIn, loginAvailable]);

  function close() {
    window.sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(false);
  }

  async function submitPhone(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!/^[6-9]\d{9}$/.test(phone)) return setMessage("Enter a valid 10-digit mobile number.");
    try {
      await requestOtp(phone);
      setStep("code");
      setMessage(`Code sent to +91 ${phone}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the code.");
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!/^\d{6}$/.test(code)) return setMessage("Enter the 6-digit code.");
    try {
      await verifyOtp(phone, code);
      if (marketingOptIn) {
        await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketingOptIn: true }) });
        await refreshCustomer();
      }
      close();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That code is incorrect.");
    }
  }

  if (!open) return null;

  return (
    <div className="welcome-offer-backdrop" role="presentation" onMouseDown={close}>
      <section className={`welcome-offer-popup ${styles.festive}`} role="dialog" aria-modal="true" aria-labelledby="welcome-offer-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.garland} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <button type="button" className="welcome-offer-close" onClick={close} aria-label="Close">×</button>
        <div className="welcome-offer-brand">
          <Image src="/leyros/leyros-logo-white.png" alt="Leyros" width={110} height={72} />
          <span>Festive edit</span>
        </div>
        <div className={styles.celebration}>
          <span className={styles.eyebrow}>A little light. A lasting memory.</span>
          <svg className={styles.diya} viewBox="0 0 180 90" fill="none" aria-hidden="true">
            <path d="M90 47C65 33 87 17 90 4c5 13 25 29 0 43Z" fill="currentColor" />
            <path d="M90 46c-9-7-2-14 0-20 3 7 10 14 0 20Z" fill="#fff7e8" />
            <path d="M44 53h92c-7 22-24 31-46 31S51 75 44 53Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M52 59c23 9 53 9 76 0M60 69c18 5 42 5 60 0M90 47v6M22 37v10m-5-5h10m127-5v10m-5-5h10M37 18l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6ZM143 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p>Let the celebrations linger.</p>
          <span className={styles.subline}>Beautiful fragrances. Thoughtful gifting.</span>
        </div>
        <div className="welcome-offer-form-card">
          <span className={styles.cardEyebrow}>Your festive invitation</span>
          <h2 id="welcome-offer-title">A season of little luxuries</h2>
          <p>Sign in for Leyros offers and find a scent to celebrate with.</p>
          {step === "phone" ? (
            <form onSubmit={submitPhone}>
              <label className="welcome-phone-field"><span>🇮🇳 +91</span><input type="tel" inputMode="numeric" autoFocus maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Enter mobile number" aria-label="Mobile number" /></label>
              <label className="welcome-consent"><input type="checkbox" checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} /><span>Notify me about offers and new launches</span></label>
              <button type="submit" disabled={isLoading}>{isLoading ? "Sending…" : "Send OTP"}</button>
            </form>
          ) : (
            <form onSubmit={submitCode}>
              <label className="welcome-code-field"><span>6-digit OTP sent to +91 {phone}</span><input type="text" inputMode="numeric" autoFocus maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" aria-label="One-time password" /></label>
              <button type="submit" disabled={isLoading}>{isLoading ? "Verifying…" : "Verify & continue"}</button>
              <button type="button" className="welcome-change-number" onClick={() => { setStep("phone"); setMessage(null); }}>Change number</button>
            </form>
          )}
          {message && <p className="welcome-offer-message" role="status">{message}</p>}
          <small>By continuing, you accept our <Link href="/legal/privacy" onClick={close}>Privacy Policy</Link> and <Link href="/legal/terms" onClick={close}>Terms</Link>.</small>
        </div>
      </section>
    </div>
  );
}
