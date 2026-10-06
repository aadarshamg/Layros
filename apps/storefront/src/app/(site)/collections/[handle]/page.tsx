import type { Metadata } from "next";
import { CollectionControls } from "@/components/collection/CollectionControls";
import { ProductCard } from "@/components/product/ProductCard";
import { getCollectionPresentation } from "@/lib/data/collection-presentation";
import { listProducts } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo/metadata";

type CollectionQuery = Record<string, string | string[] | undefined>;

function readPriceLimit(query: CollectionQuery) {
  const value = typeof query.maxPrice === "string" ? Number(query.maxPrice) : 0;
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function budgetTitle(category: string, maxPrice: number, benefit = "", occasion = "") {
  if (!maxPrice) return "";
  const amount = new Intl.NumberFormat("en-IN").format(maxPrice);
  if (occasion === "festival") return `Festival Gifts Under ₹${amount}`;
  if (benefit === "long-lasting") return `Long-Lasting Perfumes Under ₹${amount}`;
  if (category.toLowerCase().includes("gift")) return `Gifts Under ₹${amount}`;
  return `Perfumes Under ₹${amount}`;
}

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<CollectionQuery>;
}): Promise<Metadata> {
  const { handle } = await params;
  const query = await searchParams;
  const presentation = getCollectionPresentation({
    handle,
    category: typeof query.category === "string" ? query.category : "",
    family: typeof query.family === "string" ? query.family : "",
    gender: typeof query.gender === "string" ? query.gender : "",
    isNewLaunch: query.sort === "new",
  });

  const category = typeof query.category === "string" ? query.category : "";
  const family = typeof query.family === "string" ? query.family : "";
  const maxPrice = readPriceLimit(query);
  const title = budgetTitle(category, maxPrice, typeof query.benefit === "string" ? query.benefit : "", typeof query.occasion === "string" ? query.occasion : "") || presentation.title;
  const keywords = [
    title,
    "Leyros",
    "long-lasting fragrance India",
    category,
    family,
    ...(category.toLowerCase().includes("attar") ? ["Attar", "Pure Oil", "Perfume Oil", "Long-Lasting Attar"] : []),
    ...(category.toLowerCase().includes("candle") ? ["Scented Candles", "Soy Wax Candles", "Gel Wax Candles", "Concrete Candles"] : []),
    ...(category.toLowerCase().includes("car") ? ["Car Perfume", "Car Fragrance", "Long-Lasting Car Perfume"] : []),
  ].filter(Boolean);
  return buildMetadata({ title, description: presentation.description, path: `/collections/${handle}`, keywords });
}

export default async function CollectionPage({ params, searchParams }: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<CollectionQuery>;
}) {
  const { handle } = await params;
  const query = await searchParams;
  const activeCategory = typeof query.category === "string" ? query.category : "";
  const activeFamily = typeof query.family === "string" ? query.family : "";
  const activeGender = typeof query.gender === "string" ? query.gender : "";
  const maxPrice = readPriceLimit(query);
  // The migrated catalog has no reliable per-variant inventory, so this filter
  // is applied only when a customer explicitly enables it.
  const inStock = query.inStock === "1";
  const requestedSort = typeof query.sort === "string" ? query.sort : "recommended";
  const sort = (["recommended", "new", "price-asc", "price-desc"] as const).find((value) => value === requestedSort) ?? "recommended";
  const isNewLaunch = sort === "new";
  const basePresentation = getCollectionPresentation({ handle, category: activeCategory, family: activeFamily, gender: activeGender, isNewLaunch });
  const priceHeading = budgetTitle(activeCategory, maxPrice, typeof query.benefit === "string" ? query.benefit : "", typeof query.occasion === "string" ? query.occasion : "");
  const presentation = priceHeading ? {
    ...basePresentation,
    eyebrow: "Quick budget edit",
    title: priceHeading,
    description: `Shop the most affordable matching Leyros products priced at ₹${new Intl.NumberFormat("en-IN").format(maxPrice)} or below, sorted from lowest price first.`,
    highlights: ["Within your budget", "Lowest price first", "Ready to shop"],
  } : basePresentation;
  const { products } = await listProducts({
    q: typeof query.q === "string" ? query.q : undefined,
    category: activeCategory || undefined,
    family: activeFamily || undefined,
    gender: activeGender || undefined,
    inStock,
    sort,
  });
  const visibleProducts = (maxPrice
    ? products.filter((product) => product.variants.some((variant) => variant.price <= maxPrice))
    : products
  ).sort((a, b) => {
    if (!maxPrice) return 0;
    const aPrice = Math.min(...a.variants.map((variant) => variant.price));
    const bPrice = Math.min(...b.variants.map((variant) => variant.price));
    return aPrice - bPrice;
  });

  return (
    <div className="collection-page">
      <div className="page-shell">
        <header className="collection-intro">
          <div className="collection-intro-copy">
            <span className="eyebrow">{presentation.eyebrow}</span>
            <h1>{presentation.title}</h1>
            <p className="collection-intro-description">{presentation.description}</p>
          </div>
        </header>

        <CollectionControls />

        {visibleProducts.length ? (
          <div className="collection-product-grid">
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="section-heading centered"><h2>No products found</h2><p>Clear the current filter to see the full catalogue.</p></div>
        )}
      </div>
    </div>
  );
}
