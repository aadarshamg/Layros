"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { calculateBuyTwoGetOne } from "@/lib/promotions";
import styles from "./HeroOfferProgress.module.css";

const STEPS = ["Choose your first", "Choose your second", "Get your third free"];
const SHOP = "/collections/all?category=collections";

export function HeroOfferProgress({ images }: { images: string[] }) {
  const { items, isReady, openDrawer } = useCart();
  const { eligibleItemCount, freeItemCount } = calculateBuyTwoGetOne(isReady ? items : []);
  const remainder = eligibleItemCount % 3;
  const progress = eligibleItemCount > 0 && remainder === 0 ? 3 : remainder;
  const remaining = 3 - progress;
  const unlocked = freeItemCount > 0;
  const message = unlocked
    ? `${freeItemCount} free fragrance${freeItemCount === 1 ? "" : "s"} unlocked${progress < 3 ? ` · Add ${remaining} more for another` : ""}`
    : eligibleItemCount ? `Add ${remaining} more fragrance${remaining === 1 ? "" : "s"} to unlock your free one` : "Add any 3 perfumes or attars. The lowest-priced one is free.";

  return (
    <section className={styles.section} aria-labelledby="hero-offer-title">
      <div className={styles.inner}>
        <h2 id="hero-offer-title" className={styles.title}>Buy 2, get 1 free</h2>
        <div className={styles.steps}>
          <div className={styles.track} aria-hidden="true"><span style={{ width: `${Math.max(0, progress - 1) / 2 * 100}%` }} /></div>
          <ol>
            {STEPS.map((label, index) => {
              const src = images[index] ?? images[0];
              const done = progress > index;
              return (
                <li key={label} className={done ? styles.complete : undefined}>
                  <Link href={SHOP} className={styles.image} aria-label={`${label} — shop eligible fragrances`}>
                    {src ? <Image src={src} alt="" fill sizes="(max-width: 600px) 64px, 80px" /> : <svg viewBox="0 0 48 64" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M17 5h14v10H17zM20 15h8v6h-8zM10 21h28v37H10zM17 33h14v12H17z" /></svg>}
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
