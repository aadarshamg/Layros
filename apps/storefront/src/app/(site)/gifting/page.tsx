import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { getStoreSettings } from "@/lib/data/store-settings";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/site-defaults";

export const metadata: Metadata = buildMetadata({
  title: "Bespoke Gifting",
  description: "Signature Leyros gift wrap and personalised gifting for every occasion.",
  path: "/gifting",
});

export default async function GiftingPage() {
  const settings = await getStoreSettings();
  const email = settings.contactEmail || DEFAULT_CONTACT_EMAIL;
  return (
    <div className="content-page page-shell section-pad">
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Gifting", url: "/gifting" }]} />
      <div className="section-heading content-page-hero" style={{ marginTop: 24 }}>
        <p className="eyebrow with-rule">Gifting</p>
        <h1>A gift worth unwrapping</h1>
      </div>
      <p className="content-page-copy" style={{ maxWidth: 640, color: "var(--ink-soft)", fontFamily: "var(--font-playfair)", fontSize: 17, lineHeight: 1.65, marginBottom: 40 }}>
        Every Leyros bottle can be finished with our signature wax-sealed box wrap and a handwritten
        card — a small ceremony that makes the gift feel considered, not rushed. Add it to any bottle
        from its product page, or ask our concierge to help you choose.
      </p>
      <div className="button-row">
        <Link href="/products/gift-wrap" className="button button-dark">Add gift wrap to an order</Link>
        <a href={`mailto:${email}?subject=Gifting%20enquiry`} className="button button-light">
          Ask for gifting advice
        </a>
      </div>
    </div>
  );
}
