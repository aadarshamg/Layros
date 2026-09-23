import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { getStoreSettings } from "@/lib/data/store-settings";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/site-defaults";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How LEYROS collects, uses, and protects your information.",
  path: "/legal/privacy",
});

export default async function PrivacyPage() {
  const settings = await getStoreSettings();
  const email = settings.contactEmail || DEFAULT_CONTACT_EMAIL;
  return (
    <LegalPageLayout title="Privacy Policy" path="/legal/privacy" updated="20 September 2026">
      <p>
        LEYROS (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects the information you give us when you browse,
        create an account, or place an order — including your name, email, phone number, shipping and
        billing addresses, and order history. We use it only to fulfil orders, provide client care, and,
        with your consent, send occasional updates about new releases.
      </p>
      <p>
        Payment details are handled entirely by our payment provider; we never see or store your full
        card number. Your information is never sold. It may be shared with the couriers and payment
        processors needed to deliver your order, and is retained only as long as needed for that purpose
        or as required by law.
      </p>
      <p>
        You can ask to see, correct, or delete the personal information we hold about you at any time
        by emailing <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </LegalPageLayout>
  );
}
