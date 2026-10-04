import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CinematicHero } from "@/components/home/CinematicHero";
import { CinematicProductGrid } from "@/components/home/CinematicProductGrid";
import { VideoShowcase } from "@/components/home/VideoShowcase";
import { FaqSection } from "@/components/home/FaqSection";
import { PressSection } from "@/components/home/PressSection";
import { EditorialMarquee } from "@/components/home/EditorialMarquee";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { TrialSetShowcase } from "@/components/home/TrialSetShowcase";
import { GoogleReviewsSection } from "@/components/home/GoogleReviewsSection";
import { InstagramSection } from "@/components/home/InstagramSection";
import { PrivateBlendSection } from "@/components/home/PrivateBlendSection";
import { ShopByBudget } from "@/components/home/ShopByBudget";
import { getBestSellers, getCategoryShowcase, getNewArrivals } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/store-settings";

export const metadata: Metadata = buildMetadata({
  title: "LEYROS",
  description: "Discover LEYROS luxury fragrances, rare extraits, and personalized perfume crafted with Indian botanicals and Parisian precision.",
  path: "/",
});

export default async function Home() {
  const [categoryShowcase, newArrivals, bestSellers, storeSettings] = await Promise.all([
    getCategoryShowcase(),
    getNewArrivals(8),
    getBestSellers(10),
    getStoreSettings(),
  ]);

  return (
    <div className="storefront-home">
      <CinematicHero tagline={storeSettings.tagline} videoUrl={storeSettings.heroVideoUrl} posterUrl={storeSettings.heroPosterUrl} />

      <CinematicProductGrid
        eyebrow="Newly composed"
        heading="New Arrivals"
        note="Latest to the atelier"
        products={newArrivals}
        variant="new-arrivals"
      />

      <ShopByCategory entries={categoryShowcase} />

      <VideoShowcase />

      <ShopByBudget />

      <PrivateBlendSection products={bestSellers} />

      <CinematicProductGrid
        eyebrow="Most acquired"
        heading="Signature Scents"
        note="Hand-filled in small batches"
        products={bestSellers}
        variant="signature-scents"
      />

      <GoogleReviewsSection
        rating={storeSettings.googleRating}
        reviewCount={storeSettings.googleReviewCount}
        reviewsUrl={storeSettings.googleReviewsUrl}
        reviews={storeSettings.googleReviewHighlights}
      />

      <TrialSetShowcase title={storeSettings.trialSectionTitle} subtitle={storeSettings.trialSectionSubtitle} />

      <InstagramSection products={bestSellers} />


      <EditorialMarquee />

      <section className="cinematic-manifesto">
        <p>Leyros manifesto</p>
        <h2>The Chosen One</h2>
        <span>Forged through age-old hydro-distillation in Kannauj. An indelible olfactory sovereignty.</span>
      </section>

      <FaqSection />
      <PressSection />

      <section className="cinematic-service about-leyros">
        <div className="cinematic-shell cinematic-service-grid">
          <div className="about-leyros-copy">
            <p className="about-leyros-eyebrow">The house of Leyros</p>
            <h2>About Us</h2>
            <div className="about-leyros-story">
              <p>
                Leyros is a modern Indian fragrance house created for people who believe scent is
                part of how they express themselves. We bring together fine perfumery, thoughtful
                design, and an understanding of the moods, occasions, and climate of contemporary India.
              </p>
              <p>
                At the heart of our fragrances are <strong>premium perfume oils imported from France</strong>.
                They are carefully selected for their depth, balance, and character, then thoughtfully
                developed and finished by Leyros to create an expressive fragrance experience—from the
                first impression to the lasting trail.
              </p>
              <p>
                Across perfumes, traditional attars, car fragrances, scented candles, and curated gifts,
                we focus on dependable quality, considered craftsmanship, and presentation that feels
                special. Leyros stands for confidence, individuality, and accessible luxury made to be remembered.
              </p>
            </div>

            <ul className="about-leyros-values" aria-label="What makes Leyros distinctive">
              <li>
                <strong>French perfume oils</strong>
                <span>Premium fragrance oils imported from France.</span>
              </li>
              <li>
                <strong>Crafted with care</strong>
                <span>Measured, blended, filled, and presented with close attention to consistency.</span>
              </li>
              <li>
                <strong>Made for every moment</strong>
                <span>Distinctive scent experiences for you, your space, your journey, and your gifts.</span>
              </li>
            </ul>
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
