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
import { ProductOfMonth } from "@/components/home/ProductOfMonth";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { getBestSellers, getCategoryShowcase, getFamilyShowcase, getNewArrivals, getProductOfMonth } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/store-settings";

export const metadata: Metadata = buildMetadata({
  title: "LEYROS",
  description: "Discover LEYROS luxury fragrances, rare extraits, and personalized perfume crafted with Indian botanicals and Parisian precision.",
  path: "/",
});

export default async function Home() {
  const [familyShowcase, categoryShowcase, newArrivals, bestSellers, productOfMonth, storeSettings] = await Promise.all([
    getFamilyShowcase(),
    getCategoryShowcase(),
    getNewArrivals(4),
    getBestSellers(4),
    getProductOfMonth(),
    getStoreSettings(),
  ]);

  return (
    <div className="cinematic-home">
      <CinematicHero tagline={storeSettings.tagline} videoUrl={storeSettings.heroVideoUrl} posterUrl={storeSettings.heroPosterUrl} />

      <CollectionFamilyGrid entries={familyShowcase} />

      <section className="home-campaign" aria-label="Fresh Moments candle collection">
        <Link
          href="/collections/all?category=candles"
          className="home-campaign-banner"
          aria-label="Fresh Moments, Pure Calm — shop scented candles"
        >
          <span className="sr-only">Fresh Moments, Pure Calm. Shop scented candles.</span>
        </Link>
      </section>

      <ShopByCategory entries={categoryShowcase} />

      {productOfMonth && <ProductOfMonth {...productOfMonth} />}

      <CinematicProductGrid
        eyebrow="Newly composed"
        heading="New Arrivals"
        note="Latest to the atelier"
        products={newArrivals}
      />

      <EditorialMarquee />

      <CinematicProductGrid
        eyebrow="Most acquired"
        heading="Signature Scents"
        note="Hand-filled in small batches"
        products={bestSellers}
      />

      <VideoShowcase />

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
