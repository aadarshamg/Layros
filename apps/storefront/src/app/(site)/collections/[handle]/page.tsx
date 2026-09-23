import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { CollectionControls } from "@/components/collection/CollectionControls";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const title = handle === "all" ? "Shop All" : handle.replace(/-/g, " ");
  return buildMetadata({ title, description: `Explore ${title} from Leyros, perfumes, attars, and fragrance candles.`, path: `/collections/${handle}` });
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await params;
  const query = await searchParams;
  const activeCategory = typeof query.category === "string" ? query.category : "";
  const activeFamily = typeof query.family === "string" ? query.family : "";
  const activeGender = typeof query.gender === "string" ? query.gender : "";
  const inStock = query.inStock !== "0";
  const requestedSort = typeof query.sort === "string" ? query.sort : "recommended";
  const sort = (["recommended", "new", "price-asc", "price-desc"] as const).find((value) => value === requestedSort) ?? "recommended";
  const isNewLaunch = sort === "new";
  const { products, count } = await listProducts({
    q: typeof query.q === "string" ? query.q : undefined,
    category: activeCategory || undefined,
    family: activeFamily || undefined,
    gender: activeGender || undefined,
    inStock,
    sort,
  });

  return (
    <div className="collection-page">
      <div className="page-shell">
        <header className="collection-intro">
          <div className="collection-intro-copy">
            <span className="eyebrow">Pick a mood. Find your signature.</span>
            <h1>{isNewLaunch ? "New Launch" : handle === "all" ? "Shop All" : handle.replace(/-/g, " ")}</h1>
            <p>Long-lasting perfumes, concentrated attars, and scent-led gifts—made for the way you actually live.</p>
          </div>
          <div className="collection-intro-stat"><strong>{count}</strong><span>scents to explore</span></div>
        </header>

        <CollectionControls count={count} />

        {products.length ? (
          <div className="collection-product-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="section-heading centered"><h2>No products found</h2><p>Clear the current filter to see the full catalogue.</p></div>
        )}
      </div>
    </div>
  );
}
