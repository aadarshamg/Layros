import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { listProducts } from "@/lib/data/products";
import { FragranceFinderQuiz } from "@/components/fragrance-finder/FragranceFinderQuiz";

export const metadata: Metadata = buildMetadata({
  title: "Fragrance Finder",
  description: "Answer three questions and we'll recommend your Leyros signature scent.",
  path: "/fragrance-finder",
});

export default async function FragranceFinderPage() {
  const { products } = await listProducts({ limit: 50 });

  return (
    <div className="finder-section section-pad">
      <div className="page-shell">
        <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Fragrance Finder", url: "/fragrance-finder" }]} />
        <div className="finder-card" style={{ marginTop: 24, display: "block" }}>
          <FragranceFinderQuiz products={products} />
        </div>
      </div>
    </div>
  );
}
