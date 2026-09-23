"use client";

import { useEffect } from "react";

export const RECENT_PRODUCT_STORAGE_KEY = "leyros:recent-product-ids";

export function ProductInterestTracker({ productId }: { productId: string }) {
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_PRODUCT_STORAGE_KEY) ?? "[]");
      const recentIds = Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string" && id !== productId)
        : [];
      window.localStorage.setItem(
        RECENT_PRODUCT_STORAGE_KEY,
        JSON.stringify([productId, ...recentIds].slice(0, 20)),
      );
    } catch {
      // Browsing history is an enhancement; product pages still work when
      // storage is unavailable or disabled.
    }
  }, [productId]);

  return null;
}
