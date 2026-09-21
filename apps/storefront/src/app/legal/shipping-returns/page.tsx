import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = buildMetadata({
  title: "Shipping & Returns",
  description: "Delivery times, shipping costs, and our returns policy for orders within India.",
  path: "/legal/shipping-returns",
});

export default function ShippingReturnsPage() {
  return (
    <LegalPageLayout title="Shipping & Returns" path="/legal/shipping-returns" updated="20 September 2026">
      <p>
        We currently ship within India only. Standard delivery arrives in 3&ndash;5 business days;
        Express arrives the next business day. Orders over ₹3,500 include complimentary white-glove
        shipping — the exact rate for your order is shown at checkout before you pay.
      </p>
      <p>
        Because each bottle is hand-finished to order, we accept returns only for items that arrive
        damaged, incorrect, or faulty — please contact us within 7 days of delivery with photos of the
        issue and we&rsquo;ll arrange a replacement or refund. For hygiene reasons, opened fragrance
        bottles cannot otherwise be returned.
      </p>
      <p>
        Questions about a specific order should go to{" "}
        <a href="mailto:uknowmusic12@gmail.com">uknowmusic12@gmail.com</a> or{" "}
        <a href="tel:+919915082150">99150-82150</a>, with your order number if you have one.
      </p>
    </LegalPageLayout>
  );
}
