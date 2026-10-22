import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CinematicHero } from "@/components/home/CinematicHero";
import { CinematicProductGrid } from "@/components/home/CinematicProductGrid";
import { VideoShowcase } from "@/components/home/VideoShowcase";
import { FaqSection } from "@/components/home/FaqSection";
import { EditorialMarquee } from "@/components/home/EditorialMarquee";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { TrialSetShowcase } from "@/components/home/TrialSetShowcase";
import { GoogleReviewsSection } from "@/components/home/GoogleReviewsSection";
import { InstagramSection } from "@/components/home/InstagramSection";
import { PrivateBlendSection } from "@/components/home/PrivateBlendSection";
import { ShopByBudget } from "@/components/home/ShopByBudget";
import { HeroOfferProgress } from "@/components/home/HeroOfferProgress";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { getBestSellers, getCategoryShowcase, getNewArrivals } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/store-settings";
import { DEFAULT_HERO_VIDEO_URL } from "@/lib/site-defaults";
import { isBuyTwoGetOneEligible } from "@/lib/promotions";
import { productCardName } from "@/lib/product-labels";
import { defaultVariant } from "@/lib/variants";

export const metadata: Metadata = buildMetadata({
  title: "LEYROS | Best Indian Long Lasting Perfume for Men & Women",
  description: "Shop LEYROS, the best Indian long lasting perfume brand: luxury eau de parfums, attars and gift sets crafted with Indian botanicals. Free shipping over ₹999.",
  path: "/",
  keywords: ["Best Indian Long Lasting Perfume", "long lasting perfume India", "Indian perfume brand", "luxury perfume for men and women", "LEYROS"],
});

export default async function Home() {
  const [categoryShowcase, newArrivals, bestSellers, storeSettings] = await Promise.all([
    getCategoryShowcase(),
    getNewArrivals(8),
    getBestSellers(10),
    getStoreSettings(),
  ]);

  const offerProducts = [...new Map([...bestSellers, ...newArrivals].map((product) => [product.id, product])).values()]
    .filter((product) => isBuyTwoGetOneEligible(product) && product.images[0]
      && !/attar/i.test(`${product.category ?? ""} ${product.title}`)
      && !/\b(gift|pack|set|kit|combo|duo|trio|hamper|discovery|sample|trial|miniature)\b|\d\s*[x×*]\s*\d/i.test(product.title)
      && !product.variants.some((variant) => /\d\s*[x×*]\s*\d|pack|set/i.test(variant.sizeLabel ?? "")))
    .slice(0, 3)
    .map((product) => ({ image: product.images[0], title: product.title, name: productCardName(product), handle: product.handle, price: defaultVariant(product.variants)?.price ?? 0 }))
    // The lowest-priced bottle is the free one, so it goes in the FREE slot.
    .sort((a, b) => b.price - a.price);

  return (
    <div className="storefront-home">
      <CinematicHero videoUrl={DEFAULT_HERO_VIDEO_URL} />
      <HeroOfferProgress products={offerProducts} />
      <div className="home-announcement">
        <AnnouncementBar messages={storeSettings.announcementMessages} />
      </div>

      <CinematicProductGrid
        heading="New Arrivals"
        products={newArrivals}
        variant="new-arrivals"
      />

      <VideoShowcase />

      <ShopByCategory entries={categoryShowcase} />

      <ShopByBudget />

      <PrivateBlendSection products={bestSellers} />

      <CinematicProductGrid
        heading="Signature Scents"
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

      <FaqSection />

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
                developed and finished by Leyros to create an expressive fragrance experience, from the
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
            <Image src="/leyros/about-perfumery.jpg" alt="Fragrance oils and botanical ingredients being blended at a perfumery workbench" fill sizes="(max-width: 800px) 90vw, 42vw" />
          </div>
        </div>
      </section>
    </div>
  );
}
