"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export function HorizontalProductShelf({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canMoveBack, setCanMoveBack] = useState(false);
  const [canMoveForward, setCanMoveForward] = useState(true);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanMoveBack(track.scrollLeft > 2);
    setCanMoveForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    return () => {
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [updateControls]);

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
        <span>Slide products</span>
        <button type="button" disabled={!canMoveBack} onClick={() => move(-1)} aria-label={`Previous ${label} product`}>
          ←
        </button>
        <button type="button" disabled={!canMoveForward} onClick={() => move(1)} aria-label={`Next ${label} product`}>
          →
        </button>
      </div>
      <div className="cinematic-product-grid" ref={trackRef} tabIndex={0} aria-label={`${label} products`}>
        {children}
      </div>
    </div>
  );
}
