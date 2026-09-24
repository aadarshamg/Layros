"use client";

import { useRef, type ReactNode } from "react";

export function HorizontalProductShelf({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(".cinematic-product");
    if (!track || !card) return;

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: "smooth",
    });
  };

  return (
    <div className="home-product-shelf">
      <div className="home-product-shelf-controls" aria-label={`${label} carousel controls`}>
        <span>Explore the edit</span>
        <button type="button" onClick={() => move(-1)} aria-label={`Previous ${label} product`}>
          ←
        </button>
        <button type="button" onClick={() => move(1)} aria-label={`Next ${label} product`}>
          →
        </button>
      </div>
      <div className="cinematic-product-grid" ref={trackRef} tabIndex={0} aria-label={`${label} products`}>
        {children}
      </div>
    </div>
  );
}
