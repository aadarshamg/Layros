"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PerfumeProduct } from "@leyros/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useWishlist } from "@/lib/wishlist";

export function WishlistView() {
  const ids = useWishlist();
  const [products, setProducts] = useState<PerfumeProduct[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    if (!key) {
      Promise.resolve().then(() => !cancelled && setProducts([]));
      return () => { cancelled = true; };
    }
    fetch(`/api/products/by-ids?ids=${encodeURIComponent(key)}`)
      .then((response) => response.json())
      .then((data: { products: PerfumeProduct[] }) => !cancelled && setProducts(data.products))
      .catch(() => !cancelled && setProducts([]));
    return () => { cancelled = true; };
  }, [key]);

  // Removing a heart on this page hides that card straight away.
  const visible = (products ?? []).filter((product) => ids.includes(product.id));

  if (products === null) return <p className="wishlist-status">Loading your saved fragrances…</p>;
  if (visible.length === 0) {
    return (
      <div className="wishlist-empty">
        <p>Nothing saved yet. Tap the heart on any fragrance to keep it here.</p>
        <Link href="/collections/all?category=collections" className="button button-dark">Browse perfumes</Link>
      </div>
    );
  }
  return (
    <>
      <p className="wishlist-status">{visible.length} saved {visible.length === 1 ? "fragrance" : "fragrances"} · kept on this device</p>
      <div className="collection-product-grid">
        {visible.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </>
  );
}
