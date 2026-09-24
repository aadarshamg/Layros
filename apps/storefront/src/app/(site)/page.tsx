import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CinematicHero } from "@/components/home/CinematicHero";
import { CollectionFamilyGrid } from "@/components/home/CollectionFamilyGrid";
import { CinematicProductGrid } from "@/components/home/CinematicProductGrid";
import { VideoShowcase } from "@/components/home/VideoShowcase";
import { FaqSection } from "@/components/home/FaqSection";
import { PressSection } from "@/components/home/PressSection";
import { EditorialMarquee } from "@/components/home/EditorialMarquee";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { TrialSetShowcase } from "@/components/home/TrialSetShowcase";
import { getBestSellers, getCategoryShowcase, getFamilyShowcase, getNewArrivals } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/store-settings";

export const metadata: Metadata = buildMetadata({
  title: "LEYROS",
  description: "Discover LEYROS luxury fragrances, rare extraits, and personalized perfume crafted with Indian botanicals and Parisian precision.",
  path: "/",
});

export default async function Home() {
  const [familyShowcase, categoryShowcase, newArrivals, bestSellers, storeSettings] = await Promise.all([
    getFamilyShowcase(),
    getCategoryShowcase(),
    getNewArrivals(8),
    getBestSellers(10),
    getStoreSettings(),
  ]);

  return (
    <div className="storefront-home">
      <CinematicHero tagline={storeSettings.tagline} videoUrl={storeSettings.heroVideoUrl} posterUrl={storeSettings.heroPosterUrl} />

      <CollectionFamilyGrid entries={familyShowcase} />

      <CinematicProductGrid
        eyebrow="Newly composed"
        heading="New Arrivals"
        note="Latest to the atelier"
        products={newArrivals}
        variant="new-arrivals"
      />

      <ShopByCategory entries={categoryShowcase} />

      <CinematicProductGrid
        eyebrow="Most acquired"
        heading="Signature Scents"
        note="Hand-filled in small batches"
        products={bestSellers}
        variant="signature-scents"
      />

      <TrialSetShowcase title={storeSettings.trialSectionTitle} subtitle={storeSettings.trialSectionSubtitle} />

      <VideoShowcase />

      <section className="home-campaign" aria-label="Nuit Dorée candle collection">
        <Link
          href="/collections/all?category=candle"
          className="home-campaign-banner"
          aria-label="Discover the Nuit Dorée scented candle collection"
        >
          <span className="sr-only">Discover the Nuit Dorée scented candle collection.</span>
        </Link>
      </section>

      <EditorialMarquee />

      <section className="cinematic-manifesto">
        <p>Leyros manifesto</p>
        <h2>The Chosen One</h2>
        <span>Forged through age-old hydro-distillation in Kannauj and calibrated in Grasse. An indelible olfactory sovereignty.</span>
      </section>

      <FaqSection />
      <PressSection />

      <section className="cinematic-service about-leyros">
        <div className="cinematic-shell cinematic-service-grid">
          <div className="about-leyros-copy">
            <p>The house of Leyros</p>
            <h2>About Us</h2>
            <span>At Leyros, we create premium fragrances that inspire confidence and elegance. From fresh contemporary blends to rich attars, every scent is composed to leave a lasting impression.</span>
            <Link href="/story" className="cinematic-outline-button">Discover our story</Link>
          </div>
          <div className="cinematic-service-image about-leyros-logo">
            <Image src="/leyros/leyros-logo-about.webp" alt="Leyros gold logo on ivory marble" fill sizes="(max-width: 800px) 90vw, 42vw" />
          </div>
        </div>
      </section>
    </div>
  );
}
