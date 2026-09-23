import Link from "next/link";
import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { formatInr } from "@/lib/format";

export function ProductCard({ product }: { product: PerfumeProduct }) {
  const cheapestVariant = [...product.variants].sort((a, b) => a.price - b.price)[0];
  const notes = [product.details.notesTop[0], product.details.notesHeart[0], product.details.notesBase[0]].filter(Boolean);
  const compareAt = cheapestVariant?.compareAtPrice;
  const discount = cheapestVariant && compareAt && compareAt > cheapestVariant.price
    ? Math.round(((compareAt - cheapestVariant.price) / compareAt) * 100)
    : 0;

  return (
    <article className="product-card">
      <Link href={`/products/${product.handle}`} className="product-card-image">
        {product.images[0] && <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 700px) 50vw, 33vw" />}
        <span className="product-card-badge">{product.tags[0] || "Extrait de Parfum"}</span>
        {discount > 0 && <span className="product-card-discount">{discount}% off</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-card-vibe">{product.details.family || "A signature scent"}</p>
        <h3><Link href={`/products/${product.handle}`} className="product-name">{product.title}</Link></h3>
        <p className="product-notes">{notes.join(" · ") || product.description}</p>
        <div className="product-card-footer">
          {cheapestVariant && <p className="product-card-price">{formatInr(cheapestVariant.price)} {compareAt && compareAt > cheapestVariant.price ? <s>{formatInr(compareAt)}</s> : null}</p>}
          <Link href={`/products/${product.handle}`} className="product-card-cta">
            <span className="product-card-cta-label">Meet the scent</span>
            <span className="product-card-cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
