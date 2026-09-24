import Link from "next/link";
import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { ProductCardPurchasePanel } from "@/components/product/ProductCardPurchasePanel";
import { HorizontalProductShelf } from "@/components/home/HorizontalProductShelf";
import { ProductRatingLine } from "@/components/product/ProductRatingLine";
import { genderLabel } from "@/lib/product-labels";

export function CinematicProductGrid({
  eyebrow,
  heading,
  note,
  products,
  variant,
}: {
  eyebrow: string;
  heading: string;
  note?: string;
  products: PerfumeProduct[];
  variant?: "new-arrivals" | "signature-scents";
}) {
  if (products.length === 0) return null;

  return (
    <section className={`cinematic-collection${variant ? ` home-${variant}` : ""}`}>
      <div className="cinematic-shell">
        <div className="cinematic-section-title">
          <div>
            <p>{eyebrow}</p>
            <h2>{heading}</h2>
          </div>
          {note && <span>{note}</span>}
        </div>
        <HorizontalProductShelf label={heading}>
          {products.map((product) => {
            const attributes = [product.details.family, product.details.concentration].filter(Boolean);
            const gender = genderLabel(product);
            const isInStock = product.variants.some((item) => item.inventoryQuantity > 0);
            return (
              <article className="cinematic-product" key={product.id}>
                <Link href={`/products/${product.handle}`} className="cinematic-product-image">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={`${product.title} fragrance`}
                      fill
                      sizes="(max-width: 700px) 90vw, (max-width: 1100px) 50vw, 25vw"
                    />
                  )}
                  {product.tags[0] && (
                    <small className="cinematic-product-badge">
                      <span aria-hidden="true">↗</span> {product.tags[0]}
                    </small>
                  )}
                  {gender && <span className="product-gender-badge">{gender}</span>}
                </Link>
                <div className="cinematic-product-copy">
                  <h3>{product.title}</h3>
                  <ProductRatingLine handle={product.handle} count={product.reviewCount} average={product.reviewAverage} />
                  {attributes.length > 0 && (
                    <div className="cinematic-product-meta" aria-label="Product attributes">
                      {attributes.map((attribute) => <span key={attribute}>{attribute}</span>)}
                    </div>
                  )}
                  <div className={`cinematic-product-stock${isInStock ? " is-available" : ""}`}>
                    <span aria-hidden="true" /> {isInStock ? "In stock" : "Currently unavailable"}
                  </div>
                  <ProductCardPurchasePanel product={product} />
                </div>
              </article>
            );
          })}
        </HorizontalProductShelf>
      </div>
    </section>
  );
}
