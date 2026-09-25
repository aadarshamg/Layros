"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { getGuestContact, getWhatsAppConsent, RECOVERY_CONTACT_EVENT } from "@/lib/cart-recovery/client";

/**
 * Keeps a server-side copy of the cart for shoppers whose phone we know
 * (logged in, or typed at the checkout address step), so an unfinished cart
 * can get a WhatsApp reminder. Anonymous shoppers are never sent anywhere.
 */
export function CartRecoverySync() {
  const { items, isReady } = useCart();
  const { customer, isLoggedIn } = useAuth();
  const [contactVersion, setContactVersion] = useState(0);
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const bump = () => setContactVersion((value) => value + 1);
    window.addEventListener(RECOVERY_CONTACT_EVENT, bump);
    return () => window.removeEventListener(RECOVERY_CONTACT_EVENT, bump);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const guest = getGuestContact();
    if (!isLoggedIn && !guest.phone) return;

    const payload = JSON.stringify({
      lines: items.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity })),
      consent: getWhatsAppConsent(),
      phone: isLoggedIn ? undefined : guest.phone,
      name: customer?.name ?? guest.name,
    });
    if (payload === lastSent.current) return;

    const timer = window.setTimeout(() => {
      lastSent.current = payload;
      fetch("/api/cart/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {
        lastSent.current = null;
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [items, isReady, isLoggedIn, customer?.name, contactVersion]);

  return null;
}
