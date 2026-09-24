"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export function CartRecommendationSlider({ children }: { children: ReactNode }) {
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
    const frame = window.requestAnimationFrame(updateControls);
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    return () => {
      window.cancelAnimationFrame(frame);
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [updateControls, children]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(".cart-recommendation");
    if (!track || !card) return;
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <>
      <div className="cart-section-heading">
        <h3 id="cart-recommendations-title">You Might Also Like</h3>
        <div className="cart-recommendation-controls" aria-label="Recommendation carousel controls">
          <button type="button" disabled={!canMoveBack} onClick={() => move(-1)} aria-label="Previous recommendations">←</button>
          <button type="button" disabled={!canMoveForward} onClick={() => move(1)} aria-label="Next recommendations">→</button>
        </div>
      </div>
      <div className="cart-recommendation-track" ref={trackRef} tabIndex={0} aria-label="Recommended products">
        {children}
      </div>
    </>
  );
}
