import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { getStoreSettings } from "@/lib/data/store-settings";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/site-defaults";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: "The terms that govern your use of the LEYROS website and purchases.",
  path: "/legal/terms",
});

export default async function TermsPage() {
  const settings = await getStoreSettings();
  const email = settings.contactEmail || DEFAULT_CONTACT_EMAIL;
  return (
    <LegalPageLayout title="Terms of Service" path="/legal/terms" updated="20 September 2026">
      <p>
        By placing an order with LEYROS you agree to pay the listed price in Indian Rupees
        (INR), inclusive of any taxes shown at checkout, plus any shipping fee that applies. Prices and
        availability can change without notice; an order is only confirmed once payment has been
        authorised and you&rsquo;ve received a confirmation email.
      </p>
      <p>
        All product descriptions, photography, and fragrance copy on this site are the property of
        LEYROS and may not be reproduced without permission. We reserve the right to refuse or
        cancel an order — for example in cases of suspected fraud or a pricing error — in which case
        you&rsquo;ll be refunded in full.
      </p>
      <p>
        These terms are governed by the laws of India. Questions about an order or these terms can be
        sent to <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </LegalPageLayout>
  );
}
