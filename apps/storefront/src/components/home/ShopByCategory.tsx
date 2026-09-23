import Image from "next/image";
import Link from "next/link";
import type { CategoryShowcaseEntry } from "@/lib/data/products";

const CATEGORY_COPY: Record<string, string> = {
  collections: "Signature scents for every mood",
  attar: "Concentrated oils with lasting depth",
  "car perfume": "A refined atmosphere on the move",
  candle: "Warm light and fragrance for home",
  "gift pack": "Ready-to-gift Leyros favourites",
};

export function ShopByCategory({ entries }: { entries: CategoryShowcaseEntry[] }) {
  return (
    <section className="home-categories" aria-labelledby="home-category-title">
      <div className="cinematic-shell">
        <header className="home-category-heading">
          <div>
            <p>Find your kind of fragrance</p>
            <h2 id="home-category-title">Shop by category</h2>
          </div>
          <Link href="/collections/all">Explore everything <span aria-hidden="true">→</span></Link>
        </header>

        <div className="home-category-track">
          {entries.map((entry, index) => (
            <Link
              key={entry.value}
              href={`/collections/all?category=${encodeURIComponent(entry.value)}`}
              className="home-category-card"
            >
              <div className="home-category-image">
                <Image src={entry.image} alt="" fill sizes="(max-width: 700px) 75vw, (max-width: 1100px) 33vw, 20vw" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="home-category-copy">
                <div>
                  <h3>{entry.label}</h3>
                  <p>{CATEGORY_COPY[entry.value]}</p>
                </div>
                <span className="home-category-arrow" aria-hidden="true"><span>→</span></span>
              </div>
              {entry.productCount > 0 && <small>{entry.productCount} products</small>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
