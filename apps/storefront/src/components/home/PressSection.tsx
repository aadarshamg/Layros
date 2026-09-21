// Curated brand-voice statements, not customer reviews — there are no real
// verified orders yet (checkout isn't built), so nothing here is attributed
// to a fictitious customer or press outlet. Swap in genuine press mentions
// as they come in. Real customer ratings belong here once the reviews
// module (apps/medusa/src/modules/reviews/) is wired up post-checkout.
const statements = [
  {
    quote:
      "Every composition begins with a single memory, and ends only once it has been worn, revisited, and worn again.",
    source: "Maison Leyros",
    detail: "House philosophy",
  },
  {
    quote:
      "We work in small batches with independent perfumers, favouring rare naturals over trend cycles.",
    source: "The Atelier",
    detail: "On our process",
  },
  {
    quote:
      "A fragrance should feel like a private ritual — never rushed, never generic.",
    source: "Maison Leyros",
    detail: "Founding principle",
  },
];

export function PressSection() {
  return (
    <section className="press-section section-pad">
      <div className="page-shell">
        <div className="press-grid">
          {statements.map((statement) => (
            <blockquote key={statement.quote}>
              <p>&ldquo;{statement.quote}&rdquo;</p>
              <cite>
                {statement.source}
                <small>{statement.detail}</small>
              </cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
