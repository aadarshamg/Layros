"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { calculateBuyTwoGetOne } from "@/lib/promotions";
import styles from "./HeroOfferProgress.module.css";

const STEPS = ["1 perfume bottle", "1 perfume bottle", "1 free perfume bottle"];
const SHOP = "/collections/all?category=collections";

export function HeroOfferProgress() {
  const { items, isReady, openDrawer } = useCart();
  const { eligibleItemCount, freeItemCount } = calculateBuyTwoGetOne(isReady ? items : []);
  // Keep the first trio visibly complete once unlocked, rather than resetting
  // its bottle markers when the shopper adds a fourth or fifth item.
  const progress = Math.min(eligibleItemCount, 3);
  const remaining = 3 - progress;
  const unlocked = freeItemCount > 0;
  const message = unlocked
    ? `${eligibleItemCount} bottles in your bag · ${freeItemCount} free · Pay for ${eligibleItemCount - freeItemCount}`
    : eligibleItemCount === 2 ? "Add your third bottle to the bag — it’s free."
      : eligibleItemCount ? `Add ${remaining} more bottles to receive 3 and pay for 2.` : "Choose all 3 bottles. The lowest-priced bottle is free at checkout.";

  return (
    <section className={styles.section} aria-labelledby="hero-offer-title">
      <div className={styles.inner}>
        <h2 id="hero-offer-title" className={styles.title}>Buy 2, get 1 free</h2>
        <p className={styles.total}>3 perfume bottles in total. Pay for only 2.</p>
        <div className={styles.steps}>
          <div className={styles.track} aria-hidden="true"><span style={{ width: `${Math.max(0, progress - 1) / 2 * 100}%` }} /></div>
          <ol>
            {STEPS.map((label, index) => {
              const done = progress > index;
              return (
                <li key={index} className={done ? styles.complete : undefined}>
                  <Link href={SHOP} className={styles.image} aria-label={`${label} — shop eligible fragrances`}>
                    <svg viewBox="0 0 48 64" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M17 5h14v10H17z" fill="currentColor" /><path d="M20 15h8v6h-8zM10 21h28v37H10z" /><path d="M11 42h26v15H11z" fill="currentColor" opacity=".12" /><path d="M17 30h14v12H17z" /><path d="M21 34h6m-6 4h6" /></svg>
                    {index === 2 && <span className={styles.free}>Free</span>}
                  </Link>
                  <span className={styles.label}>{label}</span>
                  <span className={styles.dot} aria-hidden="true">{done ? "✓" : ""}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className={styles.message} aria-live="polite" aria-atomic="true">{message}</p>
        {unlocked && progress === 3
          ? <button type="button" onClick={openDrawer} className={styles.cta}>View your bag →</button>
          : <Link href={SHOP} className={styles.cta}>Choose your fragrances →</Link>}
      </div>
    </section>
  );
}
