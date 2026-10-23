"use client";

import { useSyncExternalStore } from "react";

// Saved products (H11), kept in this browser. Every heart button and the
// header count read the same list and update together through one event.
const STORAGE_KEY = "leyros_wishlist";
const CHANGE_EVENT = "leyros:wishlist";
const EMPTY: string[] = [];
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== cache.raw) cache = { raw, ids: raw ? (JSON.parse(raw) as string[]).filter((id) => typeof id === "string") : EMPTY };
  } catch {
    // Blocked or corrupt storage: treat as empty.
  }
  return cache.ids;
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage full or blocked: the heart still flips for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The saved product ids, newest first ([] during server rendering). */
export function useWishlist() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function toggleWishlist(productId: string) {
  const ids = read();
  write(ids.includes(productId) ? ids.filter((id) => id !== productId) : [productId, ...ids]);
}
