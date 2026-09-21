import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CinematicHero } from "@/components/home/CinematicHero";
import { CollectionFamilyGrid } from "@/components/home/CollectionFamilyGrid";
import { CinematicProductGrid } from "@/components/home/CinematicProductGrid";
import { FaqSection } from "@/components/home/FaqSection";
import { PressSection } from "@/components/home/PressSection";
import { getBestSellers, getFamilyShowcase, getNewArrivals } from "@/lib/data/products";

export const metadata: Metadata = buildMetadata({
  title: "LEYROS",
  description: "Discover LEYROS luxury fragrances, rare extraits, and personalized perfume crafted with Indian botanicals and Parisian precision.",
  path: "/",
});

export default async function Home() {
  const [familyShowcase, newArrivals, bestSellers] = await Promise.all([
    getFamilyShowcase(),
    getNewArrivals(4),
    getBestSellers(4),
  ]);

  return (
    <div className="cinematic-home">
      <CinematicHero />

      <section className="cinematic-feature">
        <Image src="/leyros/orion-feature.jpg" alt="Leyros Orion fragrance at golden hour" fill sizes="100vw" />
        <div className="cinematic-feature-shade" />
        <div className="cinematic-feature-copy">
          <p>Extrait de Parfum</p>
          <h2>Orion — Infinite. Cold. Ambitious.</h2>
          <span>Glacial aldehydes, dark ambergris, and crushed Himalayan cedarwood suspended in high-altitude obsidian glass.</span>
          <Link href="/products/nuit-doree">Explore parfum</Link>
        </div>
      </section>

      <CollectionFamilyGrid entries={familyShowcase} />

      <CinematicProductGrid
        eyebrow="Newly composed"
        heading="New Arrivals"
        note="Latest to the atelier"
        products={newArrivals}
      />

      <CinematicProductGrid
        eyebrow="Most acquired"
        heading="Best Sellers"
        note="Hand-filled in small batches"
        products={bestSellers}
      />

      <section className="cinematic-manifesto">
        <p>Leyros manifesto</p>
        <h2>The Chosen One</h2>
        <span>Forged through age-old hydro-distillation in Kannauj and calibrated in Grasse. An indelible olfactory sovereignty.</span>
      </section>

      <FaqSection />
      <PressSection />

      <section className="cinematic-service">
        <div className="cinematic-shell cinematic-service-grid">
          <div>
            <p>Private atelier service</p>
            <h2>The Legacy Coffret</h2>
            <span>Four concentrated extraits, hand-filled and presented in a black linen archive case. Your private introduction to the house of Leyros.</span>
            <Link href="/samples" className="cinematic-outline-button">Discover the ritual</Link>
          </div>
          <div className="cinematic-service-image"><Image src="/leyros/coffret-detail.jpg" alt="Leyros Legacy discovery coffret" fill sizes="(max-width: 800px) 90vw, 42vw" /></div>
        </div>
      </section>
    </div>
  );
}
