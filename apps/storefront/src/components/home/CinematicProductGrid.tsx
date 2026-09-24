import Link from "next/link";
import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { formatInr } from "@/lib/format";
import { CinematicQuickAddButton } from "@/components/home/CinematicQuickAddButton";

export function CinematicProductGrid({
  eyebrow,
  heading,
  note,
  products,
}: {
  eyebrow: string;
  heading: string;
  note?: string;
  products: PerfumeProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="cinematic-collection">
      <div className="cinematic-shell">
        <div className="cinematic-section-title">
          <div>
            <p>{eyebrow}</p>
            <h2>{heading}</h2>
          </div>
          {note && <span>{note}</span>}
        </div>
        <div className="cinematic-product-grid">
          {products.map((product) => {
            const cheapest = [...product.variants].sort((a, b) => a.price - b.price)[0];
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
                  {product.tags[0] && <small className="cinematic-product-badge">{product.tags[0]}</small>}
                </Link>
                <div className="cinematic-product-copy">
                  <h3>{product.title}</h3>
                  <p>
                    {[product.details.notesTop[0], product.details.notesHeart[0], product.details.notesBase[0]]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {cheapest && <strong>{formatInr(cheapest.price)}</strong>}
                  <CinematicQuickAddButton product={product} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
