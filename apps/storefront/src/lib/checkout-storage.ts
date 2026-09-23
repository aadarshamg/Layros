"use client";

import type { CheckoutDetailsFormData } from "@leyros/types";

// Checkout is a short, linear flow (details -> payment) within one browser
// tab, so sessionStorage is enough — no need for the persistence or
// cross-tab sharing a full context/localStorage setup would add.
const CHECKOUT_DETAILS_KEY = "leyros_checkout_details";

export function saveCheckoutDetails(data: CheckoutDetailsFormData) {
  try {
    window.sessionStorage.setItem(CHECKOUT_DETAILS_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable — the payment step will just ask again.
  }
}

export function loadCheckoutDetails(): CheckoutDetailsFormData | null {
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_DETAILS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCheckoutDetails() {
  try {
    window.sessionStorage.removeItem(CHECKOUT_DETAILS_KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
