import Link from "next/link";
import type { PerfumeProduct } from "@leyros/types";
import { ProductCard } from "@/components/product/ProductCard";

export function RelatedProducts({ products }: { products: PerfumeProduct[] }) {
  if (!products.length) return null;

  return (
    <section className="related-products" aria-labelledby="related-products-title">
      <div className="page-shell">
        <header className="related-products-heading">
          <div>
            <span>Selected for you</span>
            <h2 id="related-products-title">Related Products</h2>
            <p>Discover similar Leyros creations chosen by fragrance profile and category.</p>
          </div>
          <Link href="/collections/all">Explore all <span aria-hidden="true">→</span></Link>
        </header>
        <div className="related-products-grid">
          {products.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </div>
    </section>
  );
}
