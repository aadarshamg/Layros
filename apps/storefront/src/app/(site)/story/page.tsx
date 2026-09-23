import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Best Trending Perfumes in India 2026",
  description:
    "Discover Leyros premium inspired perfumes with luxury fragrance, long lasting performance and affordable prices.",
  path: "/story",
});

const IMAGE_ROOT = "/leyros/about-old";

export default function StoryPage() {
  return (
    <div className="legacy-about">
      <section className="legacy-about-hero">
        <div className="legacy-about-container">
          <div className="legacy-about-hero-inner">
            <div className="legacy-about-hero-content">
              <span>Trending Fragrances 2026</span>
              <h1>Best Trending Perfumes in India 2026</h1>
              <p>
                Discover premium fragrances from <strong>Leyros Perfume</strong> designed for daily wear,
                gifting, travel, and signature scents that perform well in Indian weather.
              </p>
              <Link className="legacy-about-button" href="/collections/all">
                Explore Collection
              </Link>
            </div>
            <div className="legacy-about-hero-media">
              <Image
                src={`${IMAGE_ROOT}/hero-perfume.webp`}
                alt="Leyros premium perfume bottle"
                fill
                priority
                sizes="(max-width: 768px) 280px, 420px"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="legacy-about-section">
        <div className="legacy-about-container">
          <header className="legacy-about-section-title">
            <h2>Discover India&apos;s Trending Fragrances</h2>
            <div className="legacy-about-gold-line" />
            <p>
              If you are searching for the best trending perfumes in India, you want premium smell,
              long-lasting performance, and a scent that matches your routine or gifting needs.
            </p>
          </header>
          <div className="legacy-about-grid">
            <div className="legacy-about-image legacy-about-image-420">
              <Image
                src={`${IMAGE_ROOT}/premium-perfume.webp`}
                alt="Premium perfume hero image"
                fill
                sizes="(max-width: 768px) 92vw, 560px"
              />
            </div>
            <div className="legacy-about-copy">
              <h3>Luxury Meets Everyday Elegance</h3>
              <p>
                At <strong>Leyros Perfume</strong> we craft fragrances that feel elegant, modern, and
                memorable — from alcohol-free attars to long-lasting office-friendly sprays.
              </p>
              <div className="legacy-about-highlight">
                Explore fragrance collections designed for Indian weather, premium gifting, and everyday
                luxury.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="legacy-about-section legacy-about-section-alt">
        <div className="legacy-about-container">
          <header className="legacy-about-section-title">
            <h2>Top Trending Fragrance Categories</h2>
            <div className="legacy-about-gold-line" />
            <p>
              Each category serves a unique lifestyle — daily wear, attars, gift packs, car perfumes, and
              scented candles remain strong choices in 2026.
            </p>
          </header>

          <div className="legacy-about-grid legacy-about-category-row">
            <div className="legacy-about-image legacy-about-image-320">
              <Image
                src={`${IMAGE_ROOT}/daily-wear.webp`}
                alt="Daily wear perfume bottle"
                fill
                sizes="(max-width: 768px) 92vw, 560px"
              />
            </div>
            <div className="legacy-about-copy">
              <h3>Long-Lasting Everyday Perfumes</h3>
              <p>Fresh, versatile perfumes ideal for office, college, travel, and casual outings.</p>
              <div className="legacy-about-highlight">
                <strong>Trending Notes:</strong> Citrus, aquatic, soft musk, light woods.
              </div>
            </div>
          </div>

          <div className="legacy-about-grid legacy-about-category-row">
            <div className="legacy-about-copy">
              <h3>Premium Attars</h3>
              <p>Alcohol-free, concentrated attars for festivals, prayers, and luxurious traditional wear.</p>
              <div className="legacy-about-highlight">
                <strong>Trending Notes:</strong> Oud, amber, rose, musk.
              </div>
            </div>
            <div className="legacy-about-image legacy-about-image-320">
              <Image
                src={`${IMAGE_ROOT}/premium-attar.webp`}
                alt="Premium attar bottle with gold cap"
                fill
                sizes="(max-width: 768px) 92vw, 560px"
              />
            </div>
          </div>

          <div className="legacy-about-grid legacy-about-category-row">
            <figure className="legacy-about-image legacy-about-image-320 legacy-about-figure">
              <Image
                src={`${IMAGE_ROOT}/gift-pack.webp`}
                alt="Luxury perfume gift pack"
                fill
                sizes="(max-width: 768px) 92vw, 560px"
              />
              <figcaption>Luxury Gift Pack — Ready to gift</figcaption>
            </figure>
            <div className="legacy-about-copy">
              <h3>Luxury Gift Packs</h3>
              <p>Thoughtful, premium packaging and curated fragrance sets make gifting easy and memorable.</p>
              <div className="legacy-about-highlight">
                <strong>Best For:</strong> Weddings, birthdays, corporate gifting.
              </div>
            </div>
          </div>

          <div className="legacy-about-grid legacy-about-category-row">
            <div className="legacy-about-copy">
              <h3>Car Perfumes</h3>
              <p>Compact, long-lasting car fragrances that lift the driving experience.</p>
              <div className="legacy-about-highlight">
                <strong>Popular Styles:</strong> Citrus, clean linen, woody, oceanic.
              </div>
            </div>
            <figure className="legacy-about-image legacy-about-image-320 legacy-about-figure">
              <Image
                src={`${IMAGE_ROOT}/car-perfume.webp`}
                alt="Car perfume clipped to car vent"
                fill
                sizes="(max-width: 768px) 92vw, 560px"
              />
              <figcaption>Car Perfume — Vent clip</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="legacy-about-section">
        <div className="legacy-about-container">
          <header className="legacy-about-section-title">
            <h2>Luxury Scented Candles</h2>
            <div className="legacy-about-gold-line" />
            <p>Scented candles complete a home fragrance ecosystem and support self-care and ambiance.</p>
          </header>
          <div className="legacy-about-grid">
            <figure className="legacy-about-image legacy-about-image-320 legacy-about-figure">
              <Image
                src={`${IMAGE_ROOT}/scented-candle.webp`}
                alt="Luxury scented candle on table"
                fill
                sizes="(max-width: 768px) 92vw, 560px"
              />
              <figcaption>Scented Candle — Warm vanilla</figcaption>
            </figure>
            <div className="legacy-about-copy">
              <h3>Create a Premium Home Ambience</h3>
              <p>
                Candles help transform living spaces into peaceful, elegant environments — perfect for
                gifting and home decor.
              </p>
              <div className="legacy-about-highlight">
                <strong>Trending Profiles:</strong> Vanilla, floral, woody amber, lavender.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="legacy-about-section legacy-about-section-alt">
        <div className="legacy-about-container">
          <header className="legacy-about-section-title">
            <h2>Best Leyros Product Types to Feature</h2>
            <div className="legacy-about-gold-line" />
            <p>
              Organize your catalog by customer needs: Daily Wear, Premium Gifting, Traditional Attars,
              Signature Scents, and more.
            </p>
          </header>
          <div className="legacy-about-feature-grid">
            <article className="legacy-about-feature-card">
              <span aria-hidden="true">✦</span>
              <h4>Daily Wear</h4>
              <p>Fresh, versatile fragrances for everyday confidence.</p>
            </article>
            <article className="legacy-about-feature-card">
              <span aria-hidden="true">◇</span>
              <h4>Premium Gifting</h4>
              <p>Curated gift packs and presentation-ready boxes.</p>
            </article>
            <article className="legacy-about-feature-card">
              <span aria-hidden="true">●</span>
              <h4>Traditional Luxury</h4>
              <p>Concentrated attars and oriental blends.</p>
            </article>
            <article className="legacy-about-feature-card">
              <span aria-hidden="true">★</span>
              <h4>Signature Scents</h4>
              <p>Long-lasting, memorable fragrances to define you.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="legacy-about-section">
        <div className="legacy-about-container">
          <header className="legacy-about-section-title">
            <h2>Frequently Asked Questions</h2>
            <div className="legacy-about-gold-line" />
            <p>Answers about choosing perfumes, attars, gifting, and trends in India.</p>
          </header>
          <div className="legacy-about-faqs">
            <div className="legacy-about-highlight">
              <strong>Which perfume category is best for India?</strong>
              <p>Fresh citrus, woody, aquatic and amber profiles do well in heat and humidity.</p>
            </div>
            <div className="legacy-about-highlight">
              <strong>Are attars trending?</strong>
              <p>Yes — alcohol-free concentrated attars are growing in popularity.</p>
            </div>
            <div className="legacy-about-highlight">
              <strong>Best fragrance for gifting?</strong>
              <p>Luxury gift packs and curated sets work well across occasions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="legacy-about-signoff">
        <div className="legacy-about-container">
          <Image
            src="/leyros/leyros-logo-white.png"
            alt="Leyros Essence"
            width={1280}
            height={1280}
            className="legacy-about-signoff-logo"
          />
          <p>Premium fragrances crafted for modern lifestyles — perfumes, attars, candles, car perfumes and gift packs.</p>
          <small>© 2026 Leyros Perfume. All Rights Reserved.</small>
        </div>
      </section>
    </div>
  );
}
