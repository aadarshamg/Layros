import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CartView } from "@/components/checkout/CartView";

export const metadata: Metadata = buildMetadata({
  title: "Your Cart",
  description: "Review your fragrances before checkout.",
  path: "/cart",
});

export default function CartPage() {
  return (
    <div className="cart-page page-shell section-pad">
      <p className="eyebrow">Almost yours</p>
      <h1 className="font-serif text-3xl">Your bag</h1>
      <CartView />
    </div>
  );
}
