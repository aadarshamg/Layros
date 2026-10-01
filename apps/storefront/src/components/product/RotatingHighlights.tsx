"use client";

import { useEffect, useState } from "react";

type Highlight = { title: string; icon?: string };

// Small stable offset per product so neighbouring cards don't all flip in sync.
function staggerFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(hash) % 1200;
}

export function RotatingHighlights({ highlights, seed, intervalMs = 2600 }: { highlights?: Highlight[]; seed: string; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const count = highlights?.length ?? 0;

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (count < 2 || reduceMotion) return;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => setIndex((value) => (value + 1) % count), intervalMs);
    }, staggerFor(seed));
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [count, intervalMs, reduceMotion, seed]);

  if (!highlights || count === 0) return null;

  const label = highlights.map((h) => h.title).join(", ");

  if (reduceMotion || count === 1) {
    return (
      <ul className="product-highlights is-static" aria-label={`Best for: ${label}`}>
        {highlights.map((h) => (
          <li key={h.title}><span aria-hidden="true">{h.icon || "✦"}</span> {h.title}</li>
        ))}
      </ul>
    );
  }

  const current = highlights[index % count];
  return (
    <p className="product-highlights is-rotating" aria-label={`Best for: ${label}`}>
      <span className="product-highlights-window" aria-hidden="true">
        <span key={current.title} className="product-highlights-item">
          <span className="product-highlights-icon">{current.icon || "✦"}</span>
          {current.title}
        </span>
      </span>
      <span className="product-highlights-dots" aria-hidden="true">
        {highlights.map((h, i) => <i key={h.title} className={i === index % count ? "is-on" : undefined} />)}
      </span>
    </p>
  );
}
