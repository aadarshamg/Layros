import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { listProducts } from "@/lib/data/products";
import { FAMILY_FILTER_OPTIONS } from "@/lib/data/families";
import { ProductCard } from "@/components/product/ProductCard";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const title = handle === "all" ? "The Olfactory Library" : handle.replace(/-/g, " ");
  return buildMetadata({ title, description: `Explore ${title}, the house collection of rare extraits by Leyros.`, path: `/collections/${handle}` });
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
  const activeFamily = typeof query.family === "string" ? query.family : "";
  const { products, count } = await listProducts({
    q: typeof query.q === "string" ? query.q : undefined,
    family: activeFamily || undefined,
  });

  return (
    <div className="collection-page">
      <div className="page-shell">
        <div className="collection-intro">
          <div>
            <p className="eyebrow">Haute Parfumerie · The definitive library</p>
            <h1>{handle === "all" ? "The Olfactory Library" : handle.replace(/-/g, " ")}</h1>
            <p>Singular extraits distilled in limited seasonal pressings across Kannauj and Grasse. Conceived for private collectors, each composition holds rare botanicals, aged agarwood, and architectural crystal.</p>
          </div>
          <div className="collection-count"><small>Private salon edit</small><strong>{count} Extraits · 100ml</strong></div>
        </div>

        <nav className="filter-bar" aria-label="Filter by fragrance family">
          {FAMILY_FILTER_OPTIONS.map((family) => (
            <Link key={family.label} href={family.value ? `?family=${family.value}` : "?"} className={`filter-chip ${activeFamily === family.value ? "active" : ""}`}>{family.label}</Link>
          ))}
          <span className="filter-spacer" />
          <span className="sort-label">Curated order · Maison selection</span>
        </nav>

        {products.length ? (
          <div className="collection-product-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="section-heading centered"><h2>No extraits found</h2><p>Clear the current filters to return to the full olfactory library.</p></div>
        )}

        <section className="collection-architecture">
          <div className="architecture-grid">
            <div className="architecture-copy">
              <p className="eyebrow">Apothecary provenance</p>
              <h2>Architecture of an Extrait.</h2>
              <p>Every Leyros creation matures slowly, so the base accords linger intimately on linen and pulse points. The formula unfolds in measured registers instead of evaporating as a single impression.</p>
              <div className="architecture-facts"><span><b>Extraction method</b>Ancient Deg-Bhapka copper distillation</span><span><b>Alcohol carrier</b>Organic French wheat spirit</span></div>
            </div>
            <div className="formula-card">
              <header><span>Formula decomposition · Nuit Dorée</span><span>32% concentration</span></header>
              <div className="formula-row"><strong>Head / Tête · 0–30 min <span>15% volume</span></strong><p>Saffron filaments, pink pepper distillation, and iced bergamot rind.</p></div>
              <div className="formula-row"><strong>Heart / Cœur · 30 min–6 hr <span>35% volume</span></strong><p>Damask rose absolute, aged papyrus smoke, and Moroccan cedar.</p></div>
              <div className="formula-row"><strong>Base / Fond · 6–36 hr <span>50% volume</span></strong><p>Mysore sandalwood, Assamese oud, golden benzoin, and patchouli cœur.</p></div>
            </div>
          </div>
        </section>

        <section className="collection-coffret">
          <div><p className="eyebrow">Private atelier service</p><h2>Order Bespoke Scent Blotters or Assemble Your Discovery Coffret.</h2><p>Experience the collection in your own sanctuary. Four miniature flacons arrive in custom linen paper with cotton blotters and a wax-sealed guide.</p><Link href="/samples" className="button button-gold">Assemble discovery coffret · ₹999</Link></div>
          <div className="collection-coffret-image"><Image src="/leyros/coffret-detail.jpg" alt="Leyros discovery coffret" fill sizes="(max-width: 800px) 90vw, 40vw" /></div>
        </section>
      </div>
    </div>
  );
}
