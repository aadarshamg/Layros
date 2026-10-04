import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBestSellers } from "@/lib/data/products";
import { isBuyTwoGetOneEligible } from "@/lib/promotions";
import { productCardName } from "@/lib/product-labels";

export const metadata: Metadata = buildMetadata({
  title: "Private Blends",
  description: "Discover the Leyros Private Blend edit: layered, story-led fragrances crafted with French-imported perfume oils and selected for depth, character, and lasting presence.",
  path: "/private-blends",
  keywords: ["Leyros Private Blends", "Luxury Perfume India", "French Perfume Oils", "Long-Lasting Perfume", "Niche Fragrance", "Premium Attar"],
});

export default async function PrivateBlendsPage() {
  const products = (await getBestSellers(12)).filter(isBuyTwoGetOneEligible).slice(0, 6);
  const hero = products[0];

  return (
    <main className="private-blends-page">
      <section className="private-blends-hero">
        {hero?.images[0] && <Image src={hero.images[0]} alt="" fill priority sizes="100vw" />}
        <span className="private-blends-veil" aria-hidden="true" />
        <div className="page-shell">
          <p>Composed away from the expected</p>
          <h1>Private Blends</h1>
          <strong>Not introduced. Uncovered.</strong>
          <span>Rare-feeling compositions chosen to reveal their character in chapters—from first impression to lasting trail.</span>
          <a href="#the-reveal">Begin the reveal ↓</a>
        </div>
      </section>

      <section className="private-blend-chapters page-shell" aria-label="The Private Blend philosophy">
        <article><span>01</span><h2>The Origin</h2><p>Premium perfume oils imported from France, selected for clarity, depth, and distinction.</p></article>
        <article><span>02</span><h2>The Composition</h2><p>Contrasting notes are layered to unfold gradually rather than reveal everything at once.</p></article>
        <article><span>03</span><h2>The Signature</h2><p>A high-concentration, long-lasting trail designed to feel personal on skin.</p></article>
      </section>

      <section className="private-blend-reveal" id="the-reveal" aria-labelledby="private-blend-reveal-title">
        <div className="page-shell">
          <header><span>The collection, unveiled</span><h2 id="private-blend-reveal-title">Choose the story that draws you in.</h2></header>
          <div className="private-blend-reveal-grid">
            {products.map((product, index) => (
              <Link href={`/products/${product.handle}`} key={product.id}>
                <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 700px) 92vw, 33vw" />
                <span className="private-blend-reveal-shade" aria-hidden="true" />
                <div className="private-blend-reveal-number">0{index + 1}</div>
                <div className="private-blend-reveal-copy">
                  <h3>{productCardName(product)}</h3>
                  <p>Reveal this blend <i aria-hidden="true">→</i></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
