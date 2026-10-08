import Link from "next/link";

// How the Buy 2, Get 1 Free offer works (see calculateBuyTwoGetOne): every
// 3 eligible perfumes or attars in the bag make the lowest-priced one free.
const STEPS = [
  {
    title: "Choose your favourite fragrances",
    text: "Pick any perfumes or attars you love from our collection.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="18" y="5" width="12" height="8" rx="1.5" />
        <rect x="12" y="15" width="24" height="28" rx="3" />
        <path d="M17 27h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Add any 3 to your bag",
    text: "Mix and match freely. The lowest-priced one of every 3 is free.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="8" width="7" height="14" rx="1.5" />
        <rect x="20.5" y="5" width="7" height="17" rx="1.5" />
        <rect x="32" y="8" width="7" height="14" rx="1.5" />
        <path d="M5 21h38l-3 21H8z" />
      </svg>
    ),
  },
  {
    title: "Place your order",
    text: "Check out securely and get your fragrances delivered to your doorstep.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="19" width="34" height="23" rx="2" />
        <rect x="5" y="13" width="38" height="8" rx="2" />
        <path d="M24 13v29" stroke="#fff" strokeWidth="3" />
        <path d="M24 13c-4-7-12-7-11-2 1 3 7 2 11 2zm0 0c4-7 12-7 11-2-1 3-7 2-11 2z" />
      </svg>
    ),
  },
];

export function BundleSteps() {
  return (
    <section className="bundle-steps" aria-labelledby="bundle-steps-title">
      <div className="cinematic-shell bundle-steps-grid">
        <header className="bundle-steps-intro">
          <h2 id="bundle-steps-title">Buy 2, get 1 free in 3 easy steps</h2>
          <p>Pick more fragrances, unlock more savings</p>
          <Link href="/collections/all?category=collections">Start your box <span className="ui-inline-arrow" aria-hidden="true" /></Link>
        </header>
        <ol className="bundle-steps-list">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="bundle-steps-number" aria-hidden="true">{index + 1}</span>
              <h3>{step.title}</h3>
              <span className="bundle-steps-icon">{step.icon}</span>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
