"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Customer } from "@leyros/types";

interface AuthContextValue {
  customer: Customer | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  /** Sends a fresh OTP to `phone`. Throws with a user-facing message on failure. */
  requestOtp: (phone: string) => Promise<void>;
  /** Verifies the code and, on success, loads the full profile (address, email, etc.) — a Set-Cookie header alone doesn't update React state. */
  verifyOtp: (phone: string, code: string) => Promise<{ isNewCustomer: boolean }>;
  logout: () => Promise<void>;
  /** Re-fetches the full profile from the server, e.g. after saving a new default address mid-checkout. */
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function readJsonError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children, initialCustomer }: { children: ReactNode; initialCustomer: Customer | null }) {
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = useCallback(async (phone: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        const message = await readJsonError(response, "Could not send the code. Please try again.");
        setError(message);
        throw new Error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCustomer = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setCustomer(data.customer ?? null);
    } catch {
      // Leave whatever's already in state — a failed refresh shouldn't log anyone out client-side.
    }
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, code: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code }),
        });
        const data = await response.json();
        if (!response.ok) {
          const message = data?.error ?? "That code is incorrect.";
          setError(message);
          throw new Error(message);
        }
        // The verify response only carries id/phone — fetch the full profile
        // (name, saved address, etc.) immediately rather than waiting for
        // the next full navigation, since callers like the in-drawer
        // checkout need it right away to decide whether to skip the address step.
        await refreshCustomer();
        return { isNewCustomer: Boolean(data.isNewCustomer) };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshCustomer],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ customer, isLoggedIn: customer !== null, isLoading, error, requestOtp, verifyOtp, logout, refreshCustomer }),
    [customer, isLoading, error, requestOtp, verifyOtp, logout, refreshCustomer],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
