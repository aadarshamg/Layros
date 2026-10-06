import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CANDLE_COLLECTIONS, isCandleCollectionSlug } from "@/lib/data/candle-collections";
import { getCandleShowcaseImages, listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata: Metadata = buildMetadata({
  title: "Scented Candles",
  description: "Explore Leyros concrete candles, soy wax candles, and decorative gel wax candles for gifting, rituals, and beautifully fragranced spaces.",
  path: "/candles",
  keywords: ["Leyros Candles", "Scented Candles", "Soy Wax Candles", "Gel Wax Candles", "Concrete Candles", "Candles for Home Décor", "Candle Gifts India"],
});

export default async function CandlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const requestedType = typeof query.type === "string" ? query.type : "";
  const requestedMaxPrice = typeof query.maxPrice === "string" ? Number(query.maxPrice) : 0;
  const maxPrice = Number.isFinite(requestedMaxPrice) && requestedMaxPrice > 0 ? Math.floor(requestedMaxPrice) : 0;
  const activeType = isCandleCollectionSlug(requestedType) ? requestedType : "";
  const activeCollection = CANDLE_COLLECTIONS.find((collection) => collection.slug === activeType);
  const productSection = activeCollection ?? { label: "All Candles" };
  const [{ products }, candleImages] = await Promise.all([listProducts({
    category: "candle",
    q: activeType || undefined,
    limit: 100,
  }), getCandleShowcaseImages()]);
  const visibleProducts = (maxPrice
    ? products.filter((product) => product.variants.some((variant) => variant.price <= maxPrice))
    : products
  ).sort((a, b) => maxPrice
    ? Math.min(...a.variants.map((variant) => variant.price)) - Math.min(...b.variants.map((variant) => variant.price))
    : 0);

  return (
    <main className="candles-page">
      <section className="candles-page-hero">
        <div className="page-shell candles-page-hero-grid">
          <div className="candles-page-hero-copy">
            <h1>Shop Candles</h1>
            <a href="#candle-categories">Explore candle styles <span aria-hidden="true">↓</span></a>
          </div>
          <div className="candles-page-hero-image">
            <Image src={candleImages.hero ?? "/leyros/about-old/scented-candle.webp"} alt="Leyros scented candle" fill priority sizes="(max-width: 850px) 92vw, 46vw" />
          </div>
        </div>
      </section>

      <section className="candles-page-categories" id="candle-categories" aria-labelledby="candle-category-title">
        <div className="page-shell">
          <header className="candles-page-heading">
            <h2 id="candle-category-title">Shop by style</h2>
          </header>

          <div className="candles-page-category-grid">
            {CANDLE_COLLECTIONS.map((collection) => (
              <Link
                key={collection.slug}
                href={`/candles?type=${collection.slug}#candle-products`}
                className={`candles-page-category-card${activeType === collection.slug ? " is-active" : ""}`}
              >
                <div className="candles-page-category-image">
                  <Image src={candleImages[collection.slug] ?? collection.image} alt="" fill sizes="(max-width: 700px) 92vw, 33vw" />
                </div>
                <div>
                  <h3>{collection.label}</h3>
                  <span>{activeType === collection.slug ? "Selected" : "Shop now"} <i className="ui-inline-arrow" aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="candles-page-products" id="candle-products" aria-labelledby="candle-products-title">
        <div className="page-shell">
          <header className="candles-products-heading">
            <div>
              <h2 id="candle-products-title">{maxPrice ? `Home Décor Candles Under ₹${new Intl.NumberFormat("en-IN").format(maxPrice)}` : productSection.label}</h2>
            </div>
            {activeType && <Link href="/candles#candle-products">View all candles</Link>}
          </header>

          {visibleProducts.length > 0 ? (
            <div className="collection-product-grid candles-product-grid">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="candles-empty-state">
              <h3>This candle collection is being prepared.</h3>
              <p>Explore the complete candle range while new pieces are added.</p>
              <Link href="/candles#candle-products">View all candles</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
