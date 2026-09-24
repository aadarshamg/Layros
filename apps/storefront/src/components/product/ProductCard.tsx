import Link from "next/link";
import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { ProductCardPurchasePanel } from "@/components/product/ProductCardPurchasePanel";

export function ProductCard({ product }: { product: PerfumeProduct }) {
  const cheapestVariant = [...product.variants].sort((a, b) => a.price - b.price)[0];
  const compareAt = cheapestVariant?.compareAtPrice;
  const discount = cheapestVariant && compareAt && compareAt > cheapestVariant.price
    ? Math.round(((compareAt - cheapestVariant.price) / compareAt) * 100)
    : 0;
  const tagline = [product.details.family, product.details.concentration, product.details.gender]
    .filter(Boolean)
    .join(" | ")
    .toUpperCase();

  return (
    <article className="product-card">
      <Link href={`/products/${product.handle}`} className="product-card-image">
        {product.images[0] && <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 700px) 50vw, 33vw" />}
        {product.tags[0] && (
          <span className="product-card-badge">
            <span aria-hidden="true">↗</span> {product.tags[0]}
          </span>
        )}
        {discount > 0 && <span className="product-card-discount">{discount}% off</span>}
      </Link>
      <div className="product-card-body">
        <h3><Link href={`/products/${product.handle}`} className="product-name">{product.title}</Link></h3>
        {tagline && <p className="product-card-tagline">{tagline}</p>}
        <ProductCardPurchasePanel product={product} />
      </div>
    </article>
  );
}
