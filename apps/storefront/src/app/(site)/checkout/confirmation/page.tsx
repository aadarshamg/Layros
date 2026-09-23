import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Order Confirmed",
  description: "Your Leyros order is confirmed.",
  path: "/checkout/confirmation",
});

export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; cod?: string }>;
}) {
  const { order, cod } = await searchParams;
  const isCod = cod === "1";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h1 className="font-serif text-3xl">Thank you</h1>
      <p className="mt-4 text-charcoal-soft/70">
        {isCod
          ? "Your order has been placed. Please keep the exact amount ready for cash on delivery."
          : "Your order has been placed. A confirmation will be sent to your email shortly."}
      </p>
      {order && <p className="mt-2 text-xs text-charcoal-soft/50">Order reference: {order}</p>}
      <Link
        href="/collections/all"
        className="mt-8 inline-block rounded-full border border-charcoal px-8 py-3 text-sm uppercase tracking-widest hover:bg-charcoal hover:text-offwhite"
      >
        Continue shopping
      </Link>
    </div>
  );
}
