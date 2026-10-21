"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { useCart } from "@/lib/cart-context";
import { formatInr } from "@/lib/format";
import { calculateBuyTwoGetOne } from "@/lib/promotions";
import styles from "./HeroOfferProgress.module.css";

const SHOP = "/collections/all?category=collections";

export interface OfferProduct {
  image: string;
  title: string;
  /** Short display name, e.g. "OMBRÉE LEATHER". */
  name: string;
  handle: string;
  /** Lowest price across sizes. */
  price: number;
}

/**
 * Buy 2, Get 1 Free shown as three offer cards: two paid bottles and a free
 * one. The products arrive sorted by price with the cheapest last, because
 * the lowest-priced bottle of every three is the free one at checkout.
 */
export function HeroOfferProgress({ products }: { products: OfferProduct[] }) {
  const { items, isReady, openDrawer } = useCart();
  const { eligibleItemCount, freeItemCount } = calculateBuyTwoGetOne(isReady ? items : []);
  // Keep the first trio visibly complete once unlocked, rather than resetting
  // its markers when the shopper adds a fourth or fifth bottle.
  const progress = Math.min(eligibleItemCount, 3);
  const remaining = 3 - progress;
  const unlocked = freeItemCount > 0;
  const message = unlocked
    ? `${eligibleItemCount} bottles in your bag · ${freeItemCount} free · you pay for ${eligibleItemCount - freeItemCount}`
    : eligibleItemCount === 2 ? "Add your third bottle. It's free."
      : eligibleItemCount ? `${eligibleItemCount} of 3 in your bag · add ${remaining} more to get one free`
        : "Mix and match any 3 perfumes. The lowest-priced one is free at checkout.";
  const cards = [0, 1, 2].map((index) => products[index]);

  return (
    <section className={styles.section} aria-labelledby="hero-offer-title">
      <div className={styles.inner}>
        <h2 id="hero-offer-title" className={styles.title}>Buy 2, get 1 free</h2>
        <p className={styles.subtitle}>Pick any 3 bottles · pay for only 2</p>

        <ol className={styles.cards}>
          {cards.map((product, index) => {
            const isFree = index === 2;
            const done = progress > index;
            return (
              <Fragment key={index}>
                {index > 0 && <li className={styles.operator} aria-hidden="true">+</li>}
                <li className={`${styles.card}${isFree ? ` ${styles.freeCard}` : ""}${done ? ` ${styles.done}` : ""}`}>
                  {isFree && <span className={styles.ribbon}>Free</span>}
                  {done && <span className={styles.check} aria-label="In your bag">✓</span>}
                  <Link href={product ? `/products/${product.handle}` : SHOP} className={styles.cardLink}>
                    <span className={styles.photo}>
                      {product
                        ? <Image src={product.image} alt={product.title} fill sizes="(max-width: 600px) 30vw, 260px" />
                        : <span className={styles.placeholder} aria-hidden="true">?</span>}
                    </span>
                    <span className={styles.name}>{product?.name ?? (isFree ? "Your free bottle" : "Any perfume")}</span>
                    {product && (
                      <span className={styles.price}>
                        {isFree ? <><s>{formatInr(product.price)}</s> <b>{formatInr(0)}</b></> : formatInr(product.price)}
                      </span>
                    )}
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ol>

        <div className={styles.progress} aria-hidden="true">
          {[0, 1, 2].map((index) => <span key={index} className={progress > index ? styles.filled : undefined} />)}
        </div>
        <p className={styles.message} aria-live="polite" aria-atomic="true">{message}</p>
        {unlocked && progress === 3
          ? <button type="button" onClick={openDrawer} className={styles.cta}>View your bag</button>
          : <Link href={SHOP} className={styles.cta}>Choose your 3 bottles</Link>}
      </div>
    </section>
  );
}
