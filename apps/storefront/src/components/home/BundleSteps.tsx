"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { calculateBuyTwoGetOne } from "@/lib/promotions";

// How the Buy 2, Get 1 Free offer works (see calculateBuyTwoGetOne): every
// 3 eligible perfumes or attars in the bag make the lowest-priced one free.
const SHOP_HREF = "/collections/all?category=collections";

type StepAction = { href: string; label: string } | { onClick: () => void; label: string };

const ICONS = {
  choose: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="18" y="5" width="12" height="8" rx="1.5" />
      <rect x="12" y="15" width="24" height="28" rx="3" />
      <path d="M17 27h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="9" y="8" width="7" height="14" rx="1.5" />
      <rect x="20.5" y="5" width="7" height="17" rx="1.5" />
      <rect x="32" y="8" width="7" height="14" rx="1.5" />
      <path d="M5 21h38l-3 21H8z" />
    </svg>
  ),
  order: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="7" y="19" width="34" height="23" rx="2" />
      <rect x="5" y="13" width="38" height="8" rx="2" />
      <path d="M24 13v29" stroke="#fff" strokeWidth="3" />
      <path d="M24 13c-4-7-12-7-11-2 1 3 7 2 11 2zm0 0c4-7 12-7 11-2-1 3-7 2-11 2z" />
    </svg>
  ),
};

export function BundleSteps() {
  const { items, isReady, openDrawer } = useCart();
  // Before the cart hydrates from storage, render the empty-bag state so the
  // server HTML and the client's first paint agree.
  const { eligibleItemCount, freeItemCount } = calculateBuyTwoGetOne(isReady ? items : []);
  const inCurrentSet = eligibleItemCount % 3;
  // A completed set (3, 6, …) shows as 3/3 rather than starting over at 0/3.
  const setProgress = freeItemCount > 0 && inCurrentSet === 0 ? 3 : inCurrentSet;
  const remaining = 3 - setProgress;
  const unlocked = freeItemCount > 0;
  const hasItems = isReady && items.length > 0;

  const steps: { key: keyof typeof ICONS; title: string; text: string; done: boolean; progress?: boolean; action: StepAction }[] = [
    {
      key: "choose",
      title: "Choose your favourite fragrances",
      text: "Pick any perfumes or attars you love from our collection.",
      done: eligibleItemCount > 0,
      action: { href: SHOP_HREF, label: "Browse perfumes and attars" },
    },
    {
      key: "bag",
      title: "Add any 3 to your bag",
      text: unlocked
        ? `${freeItemCount} free fragrance${freeItemCount === 1 ? "" : "s"} unlocked.${remaining && remaining < 3 ? ` Add ${remaining} more for another.` : ""}`
        : "Mix and match freely. The lowest-priced one of every 3 is free.",
      done: unlocked,
      progress: true,
      action: hasItems ? { onClick: openDrawer, label: "View your bag" } : { href: SHOP_HREF, label: "Add fragrances to your bag" },
    },
    {
      key: "order",
      title: "Place your order",
      text: "Check out securely and get your fragrances delivered to your doorstep.",
      done: false,
      action: hasItems ? { onClick: openDrawer, label: "Check out" } : { href: SHOP_HREF, label: "Shop fragrances" },
    },
  ];
  const currentIndex = unlocked ? 2 : eligibleItemCount > 0 ? 1 : 0;

  const cta: StepAction = unlocked && inCurrentSet === 0
    ? { onClick: openDrawer, label: "Check out now" }
    : eligibleItemCount > 0
      ? { href: SHOP_HREF, label: unlocked ? `Add ${remaining} more for another free` : `Add ${remaining} more to unlock` }
      : { href: SHOP_HREF, label: "Start your box" };

  return (
    <section className="bundle-steps" aria-labelledby="bundle-steps-title">
      <div className="cinematic-shell bundle-steps-grid">
        <header className="bundle-steps-intro">
          <h2 id="bundle-steps-title">Buy 2, get 1 free in 3 easy steps</h2>
          <p aria-live="polite">
            {unlocked
              ? `You've unlocked ${freeItemCount} free fragrance${freeItemCount === 1 ? "" : "s"}`
              : eligibleItemCount > 0
                ? `${eligibleItemCount} of 3 in your bag. Add ${remaining} more to get one free`
                : "Pick more fragrances, unlock more savings"}
          </p>
          {"href" in cta
            ? <Link href={cta.href}>{cta.label}</Link>
            : <button type="button" onClick={cta.onClick}>{cta.label}</button>}
        </header>
        <ol className="bundle-steps-list">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className={step.done ? "is-done" : index === currentIndex ? "is-current" : undefined}
              aria-current={index === currentIndex ? "step" : undefined}
            >
              <span className="bundle-steps-number" aria-hidden="true">{step.done ? "✓" : index + 1}</span>
              <h3>
                {"href" in step.action
                  ? <Link href={step.action.href} className="bundle-steps-link" aria-label={`${step.title}: ${step.action.label}`}>{step.title}</Link>
                  : <button type="button" onClick={step.action.onClick} className="bundle-steps-link" aria-label={`${step.title}: ${step.action.label}`}>{step.title}</button>}
              </h3>
              <span className="bundle-steps-icon">{ICONS[step.key]}</span>
              <p>{step.text}</p>
              {step.progress && (
                <span className="bundle-steps-progress" role="img" aria-label={`${setProgress} of 3 eligible fragrances in your bag`}>
                  {[0, 1, 2].map((dot) => <i key={dot} className={dot < setProgress ? "is-filled" : undefined} />)}
                </span>
              )}
              {step.done && <span className="sr-only">Completed</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
