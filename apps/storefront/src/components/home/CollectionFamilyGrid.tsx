import Link from "next/link";
import Image from "next/image";
import type { FamilyShowcaseEntry } from "@/lib/data/products";
import { FAMILY_LABELS } from "@/lib/data/families";
import { ProductCardPurchasePanel } from "@/components/product/ProductCardPurchasePanel";
import { HorizontalProductShelf } from "@/components/home/HorizontalProductShelf";

export function CollectionFamilyGrid({ entries }: { entries: FamilyShowcaseEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="cinematic-collection home-signature-collection" id="cinematic-collection">
      <div className="cinematic-shell">
        <div className="cinematic-section-title">
          <div>
            <p>Explore by fragrance family</p>
            <h2>Our Signature Collection</h2>
          </div>
          <div className="collection-title-meta">
            <Link href="/collections/all">View all fragrances <i aria-hidden="true">→</i></Link>
          </div>
        </div>
        <HorizontalProductShelf label="Our Signature Collection">
          {entries.map(({ family, product }) => {
            const attributes = [FAMILY_LABELS[family], product.details.concentration, product.details.gender].filter(Boolean);
            const isInStock = product.variants.some((variant) => variant.inventoryQuantity > 0);

            return (
              <article className="cinematic-product" key={family}>
                <Link href={`/products/${product.handle}`} className="cinematic-product-image">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="(max-width: 700px) 78vw, (max-width: 1100px) 42vw, 20vw"
                    />
                  )}
                  <small className="cinematic-product-badge">{FAMILY_LABELS[family]}</small>
                </Link>
                <div className="cinematic-product-copy">
                  <h3><Link href={`/products/${product.handle}`}>{product.title}</Link></h3>
                  <div className="cinematic-product-meta" aria-label="Product attributes">
                    {attributes.map((attribute) => <span key={attribute}>{attribute}</span>)}
                  </div>
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
