import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = {
  title: "Your wishlist | LEYROS",
  description: "The Leyros fragrances you've saved.",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="collection-page">
      <div className="page-shell section-pad">
        <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Wishlist", url: "/wishlist" }]} />
        <header className="collection-intro wishlist-intro">
          <div className="collection-intro-copy">
            <h1>Your wishlist</h1>
          </div>
        </header>
        <WishlistView />
      </div>
    </div>
  );
}
