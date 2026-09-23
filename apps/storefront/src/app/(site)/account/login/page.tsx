"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Step = "phone" | "code";

export default function LoginPage() {
  const router = useRouter();
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
      const { isNewCustomer } = await verifyOtp(phone, code);
      setInfo(isNewCustomer ? "Welcome to LEYROS!" : "Welcome back!");
      router.push("/account/orders");
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
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-widest text-charcoal-soft/60">Account</p>
      <h1 className="mt-1 font-serif text-3xl">Log in or sign up</h1>
      <p className="mt-3 text-sm text-charcoal-soft/70">
        No password needed — we&apos;ll text you a one-time code.
      </p>

      {step === "phone" && (
        <form onSubmit={handleRequestOtp} className="mt-8 space-y-4 text-sm">
          <label className="block">
            <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">Phone number</span>
            <div className="flex items-center rounded-xl border border-border px-3">
              <span className="text-charcoal-soft/60">+91</span>
              <input
                type="tel"
                required
                autoFocus
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full bg-transparent px-2 py-2 outline-none"
                placeholder="98765 43210"
              />
            </div>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-charcoal py-4 text-center text-sm uppercase tracking-widest text-offwhite disabled:opacity-60"
          >
            {isLoading ? "Sending…" : "Send code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4 text-sm">
          {info && <p className="text-charcoal-soft/70">{info}</p>}
          <label className="block">
            <span className="mb-1 block uppercase tracking-widest text-charcoal-soft/70">6-digit code</span>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-border px-3 py-2 tracking-[0.3em]"
              placeholder="••••••"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-charcoal py-4 text-center text-sm uppercase tracking-widest text-offwhite disabled:opacity-60"
          >
            {isLoading ? "Verifying…" : "Verify and continue"}
          </button>
          <div className="flex items-center justify-between text-xs text-charcoal-soft/60">
            <button type="button" onClick={() => setStep("phone")} className="underline">
              Change number
            </button>
            <button type="button" onClick={handleResend} className="underline">
              Resend code
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
