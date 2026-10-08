import Link from "next/link";
import Image from "next/image";
import type { FamilyShowcaseEntry } from "@/lib/data/products";
import { FAMILY_LABELS } from "@/lib/data/families";
import { ProductCardPurchasePanel } from "@/components/product/ProductCardPurchasePanel";
import { HorizontalProductShelf } from "@/components/home/HorizontalProductShelf";
import { productCardTitle } from "@/lib/product-labels";

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
            <Link href="/collections/all">View all fragrances </Link>
          </div>
        </div>
        <HorizontalProductShelf label="Our Signature Collection">
          {entries.map(({ family, product }) => {
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
                  <h3><Link href={`/products/${product.handle}`} aria-label={product.title} title={product.title}>{productCardTitle(product)}</Link></h3>
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
