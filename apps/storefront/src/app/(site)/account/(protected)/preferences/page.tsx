"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function PreferencesPage() {
  const router = useRouter();
  const { customer, logout } = useAuth();
  const [marketingOptIn, setMarketingOptIn] = useState(customer?.marketingOptIn ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOutEverywhere, setIsLoggingOutEverywhere] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(next: boolean) {
    setMarketingOptIn(next);
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingOptIn: next }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Could not save your preference.");
      }
      setMessage("Preferences saved.");
    } catch (err) {
      setMarketingOptIn(!next);
      setError(err instanceof Error ? err.message : "Could not save your preference.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoutEverywhere() {
    setIsLoggingOutEverywhere(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout-everywhere", { method: "POST" });
      if (!response.ok) throw new Error("Could not log out of other sessions.");
      await logout();
      router.push("/account/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log out of other sessions.");
    } finally {
      setIsLoggingOutEverywhere(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8 text-sm">
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={marketingOptIn} disabled={isSaving} onChange={(e) => handleToggle(e.target.checked)} />
          <span>Keep me updated on new releases and private sales</span>
        </label>
        {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-charcoal-soft/70">Signed out of this device but still logged in elsewhere? End every session at once.</p>
        <button
          type="button"
          onClick={handleLogoutEverywhere}
          disabled={isLoggingOutEverywhere}
          className="mt-3 rounded-full border border-charcoal px-8 py-3 text-xs uppercase tracking-widest hover:bg-charcoal hover:text-offwhite disabled:opacity-60"
        >
          {isLoggingOutEverywhere ? "Logging out…" : "Log out everywhere"}
        </button>
      </div>
    </div>
  );
}
