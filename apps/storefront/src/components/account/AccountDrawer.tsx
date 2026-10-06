"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./AccountDrawer.module.css";

const ACCOUNT_LINKS = [
  { href: "/account/orders", label: "My orders", hint: "Track and review your purchases" },
  { href: "/account/addresses", label: "Saved address", hint: "Your default delivery address" },
  { href: "/account/preferences", label: "Preferences", hint: "WhatsApp updates and sign-in" },
];

// Slide-out login / account panel opened from the header's account icon —
// same shell as the cart drawer, so it reads as part of the same system.
export function AccountDrawer() {
  const { isAccountDrawerOpen, closeAccountDrawer } = useAuth();

  useEffect(() => {
    if (!isAccountDrawerOpen) return;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAccountDrawer();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isAccountDrawerOpen, closeAccountDrawer]);

  // Mounted only while open, so the login steps start fresh every time.
  return isAccountDrawerOpen ? <AccountDrawerPanel /> : null;
}

function AccountDrawerPanel() {
  const { customer, loginAvailable, closeAccountDrawer } = useAuth();
  const [welcome, setWelcome] = useState<string | null>(null);

  return (
    <div className="cart-overlay" onClick={closeAccountDrawer} role="presentation">
      <aside
        className="cart-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-drawer-title"
      >
        <header className="cart-drawer-header">
          <div>
            <h2 id="account-drawer-title">{customer ? "My Account" : "Log in"}</h2>
          </div>
          <button type="button" onClick={closeAccountDrawer} aria-label="Close account panel" className="cart-close">×</button>
        </header>
        <div className="cart-drawer-scroll">
          {customer ? (
            <AccountMenu welcome={welcome} />
          ) : loginAvailable ? (
            <LoginForm onLoggedIn={(isNewCustomer) => setWelcome(isNewCustomer ? "Welcome to Leyros!" : "Welcome back!")} />
          ) : (
            <ComingSoon />
          )}
        </div>
      </aside>
    </div>
  );
}

function LoginForm({ onLoggedIn }: { onLoggedIn: (isNewCustomer: boolean) => void }) {
  const { requestOtp, verifyOtp, isLoading } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendCode(message: string) {
    setError(null);
    try {
      await requestOtp(phone);
      setStep("code");
      setInfo(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    }
  }

  async function handleRequestOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    await sendCode(`We've sent a 6-digit code to +91 ${phone} on WhatsApp.`);
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const { isNewCustomer } = await verifyOtp(phone, code);
      onLoggedIn(isNewCustomer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is incorrect.");
    }
  }

  return (
    <div className="cart-step">
      <h3 className="cart-step-title">Log in or sign up</h3>
      <p className="cart-step-subtitle">No password needed. We&apos;ll send a one-time code to your WhatsApp.</p>

      {step === "phone" ? (
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
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="98765 43210"
              />
            </div>
          </label>
          {error && <p className="cart-step-error">{error}</p>}
          <button type="submit" disabled={isLoading} className="cart-step-primary-button">
            {isLoading ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="cart-step-form">
          {info && <p className="cart-step-info">{info}</p>}
          <label className="cart-step-field">
            <span>6-digit code</span>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="cart-step-otp-input"
              placeholder="••••••"
            />
          </label>
          {error && <p className="cart-step-error">{error}</p>}
          <button type="submit" disabled={isLoading} className="cart-step-primary-button">
            {isLoading ? "Verifying…" : "Verify and log in"}
          </button>
          <div className="cart-step-links">
            <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }}>Change number</button>
            <button type="button" onClick={() => sendCode(`We've sent a new code to +91 ${phone} on WhatsApp.`)}>Resend code</button>
          </div>
        </form>
      )}

      <p className="cart-step-terms">
        By continuing, you agree to our <a href="/legal/terms" target="_blank" rel="noreferrer">Terms</a> &amp; <a href="/legal/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
      </p>
    </div>
  );
}

function AccountMenu({ welcome }: { welcome: string | null }) {
  const { customer, logout, isLoading, closeAccountDrawer } = useAuth();
  const router = useRouter();
  if (!customer) return null;

  async function handleLogout() {
    await logout();
    closeAccountDrawer();
    // Account pages are guarded server-side; refreshing sends a logged-out
    // visitor on one of them back to the login page.
    router.refresh();
  }

  return (
    <div className="cart-step">
      {welcome && <p className="cart-step-info">{welcome}</p>}
      <div className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">{(customer.name || "L").charAt(0).toUpperCase()}</span>
        <div>
          <h3 className="cart-step-title">{customer.name ? `Hi, ${customer.name}` : "Hi there"}</h3>
          <p className={styles.phone}>+91 {customer.phone}</p>
        </div>
      </div>

      <nav className={styles.links} aria-label="Account">
        {ACCOUNT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={closeAccountDrawer} className={styles.link}>
            <span>
              <b>{link.label}</b>
              <small>{link.hint}</small>
            </span>
            <i aria-hidden="true">›</i>
          </Link>
        ))}
      </nav>

      <button type="button" onClick={handleLogout} disabled={isLoading} className="cart-step-secondary-button">
        {isLoading ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}

function ComingSoon() {
  const { closeAccountDrawer } = useAuth();
  return (
    <div className="cart-step">
      <h3 className="cart-step-title">Accounts are coming soon</h3>
      <p className="cart-step-subtitle">
        Phone login is being set up. You can still order as a guest. Just add your delivery details at checkout.
      </p>
      <button type="button" onClick={closeAccountDrawer} className="cart-step-primary-button">Continue shopping</button>
    </div>
  );
}
