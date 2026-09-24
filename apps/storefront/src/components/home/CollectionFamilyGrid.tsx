import Link from "next/link";
import Image from "next/image";
import type { FamilyShowcaseEntry } from "@/lib/data/products";
import { FAMILY_LABELS } from "@/lib/data/families";

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
        <div className="home-family-grid">
          {entries.map(({ family, product }) => (
            <Link
              key={family}
              href={`/collections/all?family=${family}`}
              className="home-family-card"
            >
              <span className="home-family-media">
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    alt={`${FAMILY_LABELS[family]} fragrances`}
                    fill
                    sizes="(max-width: 700px) 84vw, (max-width: 1100px) 38vw, 280px"
                  />
                )}
              </span>
              <span className="home-family-copy">
                <span>
                  <small>Fragrance family</small>
                  <strong>{FAMILY_LABELS[family]}</strong>
                </span>
                <i aria-hidden="true">→</i>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
