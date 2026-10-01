import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CANDLE_COLLECTIONS, isCandleCollectionSlug } from "@/lib/data/candle-collections";
import { listProducts } from "@/lib/data/products";
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
  const productSection = activeCollection ?? {
    label: "All Candles",
    headline: "Fragrance, form, and warm light for every room.",
    uses: "Home décor, slow evenings, celebrations, housewarmings, hosting, and gifting.",
    features: ["Atmosphere-led fragrance", "Décor-ready design", "Thoughtful gifting"],
  };
  const { products } = await listProducts({
    category: "candle",
    q: activeType || undefined,
    limit: 100,
  });
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
            <span>Fragrance for the spaces you love</span>
            <h1>Shop Candles</h1>
            <p>
              Discover sculptural concrete candles, comforting soy wax blends, and luminous gel wax
              creations—designed to bring atmosphere, fragrance, and a considered sense of occasion to every room.
            </p>
            <a href="#candle-categories">Explore candle styles <span aria-hidden="true">↓</span></a>
          </div>
          <div className="candles-page-hero-image">
            <Image src="/leyros/candle.jpg" alt="Leyros scented candle glowing in a warm interior" fill priority sizes="(max-width: 850px) 92vw, 46vw" />
          </div>
        </div>
      </section>

      <section className="candles-page-categories" id="candle-categories" aria-labelledby="candle-category-title">
        <div className="page-shell">
          <header className="candles-page-heading">
            <span>Choose your candle</span>
            <h2 id="candle-category-title">Three distinctive ways to set the mood</h2>
            <p>Browse by candle construction, material, and the kind of atmosphere you want to create.</p>
          </header>

          <div className="candles-page-category-grid">
            {CANDLE_COLLECTIONS.map((collection) => (
              <Link
                key={collection.slug}
                href={`/candles?type=${collection.slug}#candle-products`}
                className={`candles-page-category-card${activeType === collection.slug ? " is-active" : ""}`}
              >
                <div className="candles-page-category-image">
                  <Image src={collection.image} alt="" fill sizes="(max-width: 700px) 92vw, 33vw" />
                </div>
                <div>
                  <h3>{collection.label}</h3>
                  <p>{collection.description}</p>
                  <span>{activeType === collection.slug ? "Selected" : "Explore collection"} <i aria-hidden="true">→</i></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="candles-benefits" aria-labelledby="candles-benefits-title">
        <div className="page-shell candles-benefits-inner">
          <header>
            <span>Why Leyros Wax Candles</span>
            <h2 id="candles-benefits-title">Made to scent, style, and gift beautifully.</h2>
          </header>
          <ul>
            <li><strong>Considered quality</strong><span>Carefully selected materials and a consistent finish.</span></li>
            <li><strong>Expressive fragrance</strong><span>Inviting scents designed to shape the mood of a room.</span></li>
            <li><strong>Beautiful aesthetics</strong><span>Display-worthy forms that complement modern interiors.</span></li>
            <li><strong>Ready to gift</strong><span>Thoughtful choices for celebrations, hosts, and special moments.</span></li>
          </ul>
        </div>
      </section>

      <section className="candles-page-products" id="candle-products" aria-labelledby="candle-products-title">
        <div className="page-shell">
          <header className="candles-products-heading">
            <div>
              <span>Handpicked for your space</span>
              <h2 id="candle-products-title">{maxPrice ? `Home Décor Candles Under ₹${new Intl.NumberFormat("en-IN").format(maxPrice)}` : productSection.label}</h2>
              <p className="candles-products-headline">{productSection.headline}</p>
              <p className="candles-products-uses"><strong>Ideal for:</strong> {productSection.uses}</p>
              <ul className="candles-products-features" aria-label={`${productSection.label} highlights`}>
                {productSection.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
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
