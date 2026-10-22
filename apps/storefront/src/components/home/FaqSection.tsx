import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageJsonLd, type FaqItem } from "@/lib/seo/jsonld/faq";

const faqs: (FaqItem & { link?: { href: string; label: string } })[] = [
  {
    question: "What's the difference between EDT, EDP, and Parfum?",
    answer:
      "It's the concentration of fragrance oil, which determines strength and how long a scent lasts. Eau de Toilette (EDT) is the lightest and freshest, Eau de Parfum (EDP) is richer and lasts longer, and Parfum (extrait) is the most concentrated, worn close to the skin with the longest trail.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Not yet. We currently ship within India only. Orders ship within 24–48 hours and arrive in 3–5 business days, and orders of ₹999 or more qualify for free standard shipping.",
  },
  {
    question: "Can I try a fragrance before buying a full bottle?",
    answer:
      "Yes. Our Discovery Sets bring five 10ml perfumes for ₹399, so you can wear each for a few days before choosing a full bottle.",
    link: { href: "/collections/all?category=tester", label: "Shop Discovery Sets" },
  },
  {
    question: "What's your returns policy?",
    answer:
      "Because fragrance is a personal-care product, we accept returns only for items that arrive damaged, incorrect, or faulty. Contact us within 7 days of delivery. For hygiene reasons, opened fragrance bottles can't otherwise be returned.",
  },
  {
    question: "Can I add gift wrap to my order?",
    answer:
      "Yes, and it's free. Tick “Add complimentary gift wrap” at checkout and add a gift message if you like.",
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
              <p>{faq.answer}{faq.link && <> <Link href={faq.link.href}>{faq.link.label}</Link></>}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
