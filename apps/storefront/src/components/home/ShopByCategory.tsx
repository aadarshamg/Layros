import Image from "next/image";
import Link from "next/link";
import type { PerfumeProduct } from "@leyros/types";
import { getCandleShowcaseImages, pickProductImages, type CategoryShowcaseEntry } from "@/lib/data/products";
import { CANDLE_COLLECTIONS } from "@/lib/data/candle-collections";

const CATEGORY_COPY: Record<string, string> = {
  collections: "Signature scents for every mood",
  attar: "Concentrated oils with lasting depth",
  "car perfume": "A refined atmosphere on the move",
  candle: "Warm light and fragrance for home",
  "gift pack": "Ready-to-gift Leyros favourites",
};

const textOf = (product: PerfumeProduct) => `${product.title} ${product.description}`.toLowerCase();
const inCategory = (keyword: string) => (product: PerfumeProduct) => (product.category ?? "").toLowerCase().includes(keyword);
const isPerfume = inCategory("collections");

// Each tile shows the photo of a real catalogue product it links to (see
// pickProductImages); `fallbackImage` is only used when nothing matches.
const GENDER_COLLECTIONS = [
  {
    label: "Men",
    title: "Fragrances for Him",
    description: "Confident woods, fresh aromatics, rich ambers, and statement-making trails.",
    gender: "masculine",
    fallbackImage: "/leyros/about-old/hero-perfume.webp",
  },
  {
    label: "Women",
    title: "Fragrances for Her",
    description: "Radiant florals, luminous fruits, soft musks, and elegant signatures.",
    gender: "feminine",
    fallbackImage: "/leyros/about-old/daily-wear.webp",
  },
  {
    label: "Unisex",
    title: "Fragrances for Everyone",
    description: "Balanced compositions made to be chosen by character, not convention.",
    gender: "unisex",
    fallbackImage: "/leyros/about-old/gift-pack.webp",
  },
] as const;

// Links filter by the catalogue's real collection categories — every product's
// `family` is still the migration default, so family links came up empty.
const NOTE_COLLECTIONS = [
  {
    label: "Tobacco",
    description: "Smoky, warm, and richly textured.",
    href: "/collections/all?q=tobacco",
    match: (product: PerfumeProduct) => isPerfume(product) && textOf(product).includes("tobacco"),
    fallbackImage: "/leyros/about-old/premium-attar.webp",
  },
  {
    label: "Vanilla",
    description: "Creamy, comforting, and softly sweet.",
    href: "/collections/all?q=vanilla",
    match: (product: PerfumeProduct) => isPerfume(product) && textOf(product).includes("vanilla"),
    fallbackImage: "/leyros/about-old/car-perfume.webp",
  },
  {
    label: "Woody",
    description: "Sandalwood, cedar, vetiver, and warm forest tones.",
    href: "/collections/all?category=woody",
    match: inCategory("woody"),
    fallbackImage: "/leyros/sandalwood.jpg",
  },
  {
    label: "Amber",
    description: "Golden resins, soft spice, musk, and enveloping warmth.",
    href: "/collections/all?category=ambry",
    match: inCategory("ambry"),
    fallbackImage: "/leyros/saffron.jpg",
  },
  {
    label: "Floral",
    description: "Rose, jasmine, iris, and luminous petal-led bouquets.",
    href: "/collections/all?category=floral",
    match: inCategory("floral"),
    fallbackImage: "/leyros/rose.jpg",
  },
  {
    label: "Fresh Citrus",
    description: "Bright citrus, clean aromatics, and airy freshness.",
    href: "/collections/all?category=citrus",
    match: inCategory("citrus"),
    fallbackImage: "/leyros/about-old/premium-perfume.webp",
  },
  {
    label: "Gourmand",
    description: "Vanilla, sweetness, spice, and deliciously rich notes.",
    href: "/collections/all?category=gourmand",
    match: inCategory("gourmand"),
    fallbackImage: "/leyros/about-old/daily-wear.webp",
  },
  {
    label: "Oud",
    description: "Deep, resinous, and confidently intense.",
    href: "/collections/all?category=oud",
    match: inCategory("oud"),
    fallbackImage: "/leyros/about-old/gift-pack.webp",
  },
] as const;

const TILE_IMAGE_RULES: Record<string, (product: PerfumeProduct) => boolean> = Object.fromEntries([
  ...GENDER_COLLECTIONS.map((collection) => [
    `gender:${collection.gender}`,
    (product: PerfumeProduct) => isPerfume(product) && product.details.gender === collection.gender,
  ]),
  ...NOTE_COLLECTIONS.map((note) => [`note:${note.label}`, note.match]),
]);

export async function ShopByCategory({ entries }: { entries: CategoryShowcaseEntry[] }) {
  const [tileImages, candleImages] = await Promise.all([pickProductImages(TILE_IMAGE_RULES), getCandleShowcaseImages()]);
  const categoryHref = (value: string) => value === "candle"
    ? "/candles"
    : `/collections/all?category=${encodeURIComponent(value)}`;

  return (
    <section className="home-categories" aria-labelledby="home-category-title">
      <div className="cinematic-shell">
        <header className="home-category-heading">
          <div>
            <p>One house, many fragrance worlds</p>
            <h2 id="home-category-title">Shop By Category</h2>
            <span className="home-category-intro">
              From everyday perfumes and traditional attars to car fragrances, scented candles,
              and thoughtful gift packs—discover Leyros for every mood, space, and occasion.
            </span>
          </div>
          <Link href="/collections/all">Explore everything <span aria-hidden="true">→</span></Link>
        </header>

        <div className="home-gender-grid" aria-label="Shop fragrances by preference">
          {GENDER_COLLECTIONS.map((collection) => (
            <Link
              key={collection.gender}
              href={`/collections/all?category=collections&gender=${collection.gender}`}
              className="home-gender-card"
            >
              <Image src={tileImages[`gender:${collection.gender}`] ?? collection.fallbackImage} alt="" fill sizes="(max-width: 700px) 92vw, 33vw" />
              <span className="home-gender-card-shade" aria-hidden="true" />
              <div className="home-gender-card-copy">
                <span>{collection.label}</span>
                <h3>{collection.title}</h3>
                <p>{collection.description}</p>
                <b>Shop {collection.label} <i aria-hidden="true">→</i></b>
              </div>
            </Link>
          ))}
        </div>

        <section className="home-notes-section" aria-labelledby="home-notes-title">
          <header className="home-notes-heading">
            <div>
              <span>Follow the notes you love</span>
              <h3 id="home-notes-title">Shop by Notes</h3>
              <p>Explore fragrances by the scent profile that feels most like you.</p>
            </div>
            <Link href="/collections/all?category=collections">Explore all perfumes <span aria-hidden="true">→</span></Link>
          </header>

          <div className="home-notes-grid">
            {NOTE_COLLECTIONS.map((note) => (
              <Link key={note.label} href={note.href} className="home-note-card" aria-label={`${note.label}: ${note.description}`}>
                <div className="home-note-image">
                  <Image src={tileImages[`note:${note.label}`] ?? note.fallbackImage} alt="" fill sizes="(max-width: 650px) 46vw, (max-width: 1000px) 30vw, 20vw" />
                </div>
                <div className="home-note-copy">
                  <h4>{note.label}</h4>
                  <p>{note.description}</p>
                  <span>Discover <i aria-hidden="true">→</i></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-candles-section" aria-labelledby="home-candles-title">
          <header className="home-candles-heading">
            <div>
              <span>Fragrance for your space</span>
              <h3 id="home-candles-title">Shop Candles</h3>
              <p>Discover candle styles for quiet rituals, thoughtful gifts, and beautifully scented rooms.</p>
            </div>
            <Link href="/candles">View all candles <span aria-hidden="true">→</span></Link>
          </header>

          <div className="home-candles-grid">
            {CANDLE_COLLECTIONS.map((collection) => (
              <Link key={collection.label} href={`/candles?type=${collection.slug}#candle-products`} className="home-candle-card">
                <Image src={candleImages[collection.slug] ?? collection.image} alt="" fill sizes="(max-width: 700px) 92vw, 33vw" />
                <span className="home-candle-card-shade" aria-hidden="true" />
                <div className="home-candle-card-copy">
                  <h4>{collection.label}</h4>
                  <p>{collection.description}</p>
                  <b>Explore collection <i aria-hidden="true">→</i></b>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="home-category-secondary-heading">
          <span>More ways to discover Leyros</span>
          <h3>Explore every product category</h3>
        </div>

        <nav className="home-category-overview" aria-label="Browse every product category">
          {entries.map((entry) => (
            <Link key={`overview-${entry.value}`} href={categoryHref(entry.value)}>
              {entry.label}
            </Link>
          ))}
          <Link href="/collections/all" className="home-category-overview-all">
            Explore all <span aria-hidden="true">→</span>
          </Link>
        </nav>

        <div className="home-category-track">
          {entries.map((entry) => (
            <Link
              key={entry.value}
              href={categoryHref(entry.value)}
              className="home-category-card"
            >
              <div className="home-category-image">
                <Image src={entry.image} alt="" fill sizes="(max-width: 700px) 75vw, (max-width: 1100px) 33vw, 20vw" />
              </div>
              <div className="home-category-copy">
                <div>
                  <h3>{entry.label}</h3>
                  <p>{CATEGORY_COPY[entry.value] ?? "Explore the complete Leyros collection"}</p>
                </div>
                <span className="home-category-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h13m-5-5 5 5-5 5" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
