"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PerfumeProduct } from "@leyros/types";
import { ProductCard } from "@/components/product/ProductCard";

const FAMILY_STEP = {
  question: "Which family draws you in?",
  key: "family" as const,
  options: [
    { value: "floral", label: "Floral", hint: "Iris, rose, orange blossom" },
    { value: "woody", label: "Woody", hint: "Sandalwood, vetiver, cedar" },
    { value: "oriental", label: "Oriental & amber", hint: "Oud, saffron, leather" },
    { value: "fresh", label: "Fresh", hint: "Citrus, neroli, green tea" },
    { value: "gourmand", label: "Gourmand", hint: "Vanilla, resin, spice" },
  ],
};

const INTENSITY_STEP = {
  question: "How do you want it to feel?",
  key: "intensity" as const,
  options: [
    { value: "light", label: "Light", hint: "Barely-there, close to skin" },
    { value: "moderate", label: "Moderate", hint: "Noticeable, not overpowering" },
    { value: "strong", label: "Strong", hint: "A trail that lingers" },
  ],
};

const OCCASION_STEP = {
  question: "When will you wear it most?",
  key: "occasion" as const,
  options: [
    { value: "day", label: "By day", hint: "Office, errands, daylight" },
    { value: "evening", label: "By night", hint: "Dinner, events, after dark" },
  ],
};

type Answers = { family?: string; intensity?: string; occasion?: string };

function scoreProduct(product: PerfumeProduct, answers: Answers): number {
  let score = 0;
  if (answers.family && product.details.family === answers.family) score += 3;
  if (answers.intensity && product.details.intensity === answers.intensity) score += 2;
  // No occasion field on perfume_details yet — use intensity as a light proxy
  // (strong scents read better for evening, light ones for day).
  if (answers.occasion === "evening" && product.details.intensity === "strong") score += 1;
  if (answers.occasion === "day" && product.details.intensity !== "strong") score += 1;
  return score;
}

export function FragranceFinderQuiz({ products }: { products: PerfumeProduct[] }) {
  const steps = [FAMILY_STEP, INTENSITY_STEP, OCCASION_STEP];
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const results = useMemo(() => {
    if (!done) return [];
    return [...products]
      .map((product) => ({ product, score: scoreProduct(product, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r) => r.product);
  }, [done, products, answers]);

  function choose(key: keyof Answers, value: string) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setDone(true);
    }
  }

  function retake() {
    setAnswers({});
    setStepIndex(0);
    setDone(false);
  }

  if (done) {
    return (
      <div>
        <p className="eyebrow with-rule">Your recommendations</p>
        <h2 style={{ marginTop: 8, marginBottom: 32 }}>Fragrances chosen for you</h2>
        {results.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>
            We couldn&rsquo;t find a match yet — the collection is still growing.{" "}
            <Link href="/collections/all" style={{ textDecoration: "underline" }}>Browse everything</Link>.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {results.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
        <button type="button" onClick={retake} className="button button-light" style={{ marginTop: 32 }}>
          Retake the quiz
        </button>
      </div>
    );
  }

  const step = steps[stepIndex];
  return (
    <div>
      <p className="eyebrow with-rule">
        Question {stepIndex + 1} of {steps.length}
      </p>
      <h2 style={{ marginTop: 8, marginBottom: 32 }}>{step.question}</h2>
      <div style={{ display: "grid", gap: 12, maxWidth: 460 }}>
        {step.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(step.key, option.value)}
            className="button button-light full-button"
            style={{ justifyContent: "space-between", textTransform: "none", letterSpacing: "normal", fontWeight: 500, padding: "18px 22px" }}
          >
            <span>{option.label}</span>
            <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
