import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageJsonLd, type FaqItem } from "@/lib/seo/jsonld/faq";

const faqs: FaqItem[] = [
  {
    question: "What's the difference between EDT, EDP, and Parfum?",
    answer:
      "It's the concentration of fragrance oil, which determines strength and how long a scent lasts. Eau de Toilette (EDT) is the lightest and freshest, Eau de Parfum (EDP) is richer and lasts longer, and Parfum (extrait) is the most concentrated, worn close to the skin with the longest trail.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Not yet — we currently ship within India only. Standard delivery arrives in 3–5 business days, Express the next business day, and orders over ₹3,500 include complimentary white-glove shipping.",
  },
  {
    question: "Can I try a fragrance before buying a full bottle?",
    answer:
      "Yes. Email our concierge team and we'll assemble a discovery coffret of two or three extraits suited to your preferences, so you can live with a scent for a few days before committing.",
  },
  {
    question: "What's your returns policy?",
    answer:
      "Because each bottle is hand-finished to order, we accept returns only for items that arrive damaged, incorrect, or faulty — contact us within 7 days of delivery. For hygiene reasons, opened fragrance bottles can't otherwise be returned.",
  },
  {
    question: "Can I add gift wrap to my order?",
    answer:
      "Yes — every bottle can be finished with our signature wax-sealed box wrap and a handwritten card. Add it from any product page, or ask our concierge team for gifting advice.",
  },
  {
    question: "How should I store my fragrance?",
    answer:
      "Keep it out of direct sunlight and away from heat, ideally in its box, at a stable room temperature. Stored well, a bottle keeps its character for years.",
  },
];

// Sits in its own light section — a deliberate pause against the homepage's
// black cinematic theme, same as the press/trust section next to it, rather
// than new dark-mode accordion styling.
export function FaqSection() {
  return (
    <section className="faq-section section-pad">
      <JsonLd data={faqPageJsonLd(faqs)} />
      <div className="page-shell">
        <div className="section-heading">
          <p className="eyebrow with-rule">Questions</p>
          <h2>Frequently Asked</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
