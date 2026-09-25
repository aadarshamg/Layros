import type { Metadata } from "next";
import Link from "next/link";
import { findCartByToken, recoveryClient, resolveCartLines } from "@/lib/cart-recovery/store";
import { RestoreCart } from "@/components/checkout/RestoreCart";

export const metadata: Metadata = { title: "Your Leyros bag", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RestoreCartPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cart = await findCartByToken(token);
  const lines = cart ? await resolveCartLines(cart.items ?? []) : [];

  if (!cart || lines.length === 0) {
    return (
      <section className="page-shell restore-cart">
        <h1>This bag link has expired</h1>
        <p>The products may have sold out or the link is no longer valid — but the collection is still waiting for you.</p>
        <Link href="/collections/all" className="review-write-button">Browse fragrances</Link>
      </section>
    );
  }

  if (recoveryClient) {
    await recoveryClient.patch(cart._id).set({ restoredAt: new Date().toISOString() }).commit().catch(() => undefined);
  }

  return (
    <section className="page-shell restore-cart">
      <h1>Restoring your bag…</h1>
      <p>One moment — we&apos;re putting your {lines.length === 1 ? "item" : `${lines.length} items`} back in your bag.</p>
      <RestoreCart lines={lines} />
    </section>
  );
}
