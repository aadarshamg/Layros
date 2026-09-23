import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { getStoreSettings } from "@/lib/data/store-settings";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/site-defaults";

export const metadata: Metadata = buildMetadata({
  title: "Discovery Coffrets",
  description: "Sample the Leyros collection before committing to a full bottle.",
  path: "/samples",
});

export default async function SamplesPage() {
  const settings = await getStoreSettings();
  const email = settings.contactEmail || DEFAULT_CONTACT_EMAIL;
  return (
    <div className="content-page page-shell section-pad">
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Samples", url: "/samples" }]} />
      <div className="section-heading content-page-hero" style={{ marginTop: 24 }}>
        <p className="eyebrow with-rule">Discovery</p>
        <h1>Try before you commit</h1>
      </div>
      <p className="content-page-copy" style={{ maxWidth: 640, color: "var(--ink-soft)", fontFamily: "var(--font-playfair)", fontSize: 17, lineHeight: 1.65, marginBottom: 40 }}>
        A discovery coffret lets you live with two or three extraits over several days before choosing
        your signature bottle. Curated sample sets are assembled by our concierge team to suit your
        preferences — tell us what you&rsquo;re drawn to and we&rsquo;ll put one together for you.
      </p>
      <div className="button-row">
        <a href={`mailto:${email}?subject=Discovery%20coffret`} className="button button-dark">
          Request a discovery coffret
        </a>
        <Link href="/collections/all" className="button button-light">Browse the full collection</Link>
      </div>
    </div>
  );
}
