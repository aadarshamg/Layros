import Link from "next/link";
import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { ProductCardPurchasePanel } from "@/components/product/ProductCardPurchasePanel";
import { HorizontalProductShelf } from "@/components/home/HorizontalProductShelf";

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
            const tagline = [product.details.family, product.details.concentration, product.details.gender]
              .filter(Boolean)
              .join(" | ")
              .toUpperCase();
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
                </Link>
                <div className="cinematic-product-copy">
                  <h3>{product.title}</h3>
                  {tagline && <p>{tagline}</p>}
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
