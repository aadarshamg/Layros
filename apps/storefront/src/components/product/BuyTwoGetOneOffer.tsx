"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SESSION_KEY = "leyros-buy-two-get-one-seen";

export function BuyTwoGetOneOffer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closePopup() {
    window.sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(false);
  }

  return (
    <>
      <aside className="page-shell b2g1-banner" aria-label="Buy 2 Get 1 Free offer">
        <div className="b2g1-banner-mark" aria-hidden="true">3</div>
        <div className="b2g1-banner-copy">
          <strong>Buy 2, Get 1 Free</strong>
          <p>Only on Perfumes &amp; Attars. Add any 3 eligible fragrances to your bag.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)}>View offer details</button>
      </aside>

      {open && (
        <div className="b2g1-modal-backdrop" role="presentation" onMouseDown={closePopup}>
          <section
            className="b2g1-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="b2g1-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="b2g1-modal-close" type="button" onClick={closePopup} aria-label="Close offer details">×</button>
            <span className="b2g1-modal-kicker">Leyros limited-time offer</span>
            <div className="b2g1-modal-emblem" aria-hidden="true"><b>2</b><span>+</span><b>1</b></div>
            <h2 id="b2g1-title">Buy 2, Get 1 Free</h2>
            <p className="b2g1-modal-lead">Choose any three eligible Perfumes or Attars. The lowest-priced eligible item is free.</p>
            <div className="b2g1-conditions">
              <strong>Offer applies only to</strong>
              <p>Perfumes and Attars</p>
              <strong>Offer does not apply to</strong>
              <p>Candles, Car Perfumes, Luxury Gift Sets, or Travel Packs</p>
            </div>
            <Link href="/collections/all" onClick={closePopup}>Shop eligible fragrances</Link>
            <button className="b2g1-continue" type="button" onClick={closePopup}>Continue viewing this product</button>
          </section>
        </div>
      )}
    </>
  );
}
