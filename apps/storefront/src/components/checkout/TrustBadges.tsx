"use client";

import { useEffect, useState } from "react";

interface TrustBadgeSettings {
  googleRating?: number;
  googleReviewCount?: number;
}

/**
 * Real, honest trust signals only — no invented "170 years of heritage"
 * style claims. The rating badge only renders once an admin has actually
 * set a real Google rating in Store Settings; the other three are always-
 * true facts about how this store actually operates.
 */
export function TrustBadges() {
  const [settings, setSettings] = useState<TrustBadgeSettings>({});

  useEffect(() => {
    fetch("/api/store-settings")
      .then((response) => response.json())
      .then((data) => setSettings(data))
      .catch(() => setSettings({}));
  }, []);

  const hasRating = typeof settings.googleRating === "number" && typeof settings.googleReviewCount === "number";

  return (
    <div className="trust-badges">
      {hasRating && (
        <div className="trust-badge">
          <span aria-hidden="true">★</span>
          <span>Rated {settings.googleRating?.toFixed(1)} by {settings.googleReviewCount}+ customers</span>
        </div>
      )}
      <div className="trust-badge"><span aria-hidden="true">📍</span><span>Made in Kannauj, India</span></div>
      <div className="trust-badge"><span aria-hidden="true">🔒</span><span>Secure checkout · Razorpay encrypted</span></div>
      <div className="trust-badge"><span aria-hidden="true">🚚</span><span>Complimentary delivery across India</span></div>
    </div>
  );
}
