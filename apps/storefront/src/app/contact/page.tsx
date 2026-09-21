import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "Contact & Client Care",
  description: "Reach the Leyros client care team — private consultations, order support, and boutique enquiries.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="page-shell section-pad">
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]} />
      <div className="section-heading" style={{ marginTop: 24 }}>
        <p className="eyebrow with-rule">Client Care</p>
        <h1>We&rsquo;re here to help</h1>
      </div>

      <div style={{ display: "grid", gap: 40, gridTemplateColumns: "1fr", maxWidth: 640 }}>
        <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-playfair)", fontSize: 17, lineHeight: 1.65 }}>
          Whether you&rsquo;re choosing a first bottle, arranging a gift, or following up on an order,
          our concierge team responds personally to every enquiry.
        </p>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <p className="eyebrow">Email</p>
            <a href="mailto:uknowmusic12@gmail.com" className="button-row" style={{ fontFamily: "var(--font-playfair)", fontSize: 17 }}>
              uknowmusic12@gmail.com
            </a>
          </div>
          <div>
            <p className="eyebrow">Phone</p>
            <a href="tel:+919915082150" style={{ fontFamily: "var(--font-playfair)", fontSize: 17 }}>
              99150-82150
            </a>
          </div>
          <div>
            <p className="eyebrow">Private consultations</p>
            <p style={{ color: "var(--ink-soft)" }}>
              Booked by appointment for fragrance selection, gifting, and bespoke coffret assembly.
              Email us to arrange a time.
            </p>
          </div>
        </div>

        <a href="mailto:uknowmusic12@gmail.com" className="button button-dark" style={{ width: "fit-content" }}>
          Email client care
        </a>
      </div>
    </div>
  );
}
