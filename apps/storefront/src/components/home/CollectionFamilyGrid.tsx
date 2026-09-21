import Link from "next/link";
import Image from "next/image";
import type { FamilyShowcaseEntry } from "@/lib/data/products";
import { FAMILY_LABELS } from "@/lib/data/families";

export function CollectionFamilyGrid({ entries }: { entries: FamilyShowcaseEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="cinematic-collection" id="cinematic-collection">
      <div className="cinematic-shell">
        <div className="cinematic-section-title">
          <div>
            <p>Explore by family</p>
            <h2>The Collection</h2>
          </div>
          <span>Shop by fragrance family</span>
        </div>
        <div className="cinematic-product-grid">
          {entries.map(({ family, product }) => (
            <Link
              key={family}
              href={`/collections/all?family=${family}`}
              className="cinematic-product-image"
              style={{ display: "block" }}
            >
              {product.images[0] && (
                <Image
                  src={product.images[0]}
                  alt={`${FAMILY_LABELS[family]} fragrances`}
                  fill
                  sizes="(max-width: 700px) 90vw, (max-width: 1100px) 50vw, 25vw"
                />
              )}
              <small>{FAMILY_LABELS[family]}</small>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
