import Image from "next/image";
import Link from "next/link";
import { DEFAULT_TAGLINE, DEFAULT_HERO_VIDEO_URL, DEFAULT_HERO_POSTER_URL, HERO_BANNER } from "@/lib/site-defaults";

export function CinematicHero({ tagline, videoUrl, posterUrl }: { tagline?: string; videoUrl?: string; posterUrl?: string }) {
  if (HERO_BANNER) {
    // The banner carries its own headline and "Shop now" art, so the whole
    // image is the link and no text is laid over it.
    return (
      <section className="hero-banner">
        <h1 className="sr-only">LEYROS Luxury Fragrance House</h1>
        <Link href={HERO_BANNER.href} className="hero-banner-link" aria-label="Shop Leyros signature fragrances">
          <Image
            src={HERO_BANNER.src}
            alt={HERO_BANNER.alt}
            width={HERO_BANNER.width}
            height={HERO_BANNER.height}
            priority
            sizes="(max-width: 600px) 100vw, (max-width: 1400px) 98vw, 1400px"
          />
        </Link>
      </section>
    );
  }

  return (
    <section className="cinematic-hero">
      <video
        className="cinematic-hero-video"
        autoPlay
        loop
        muted
        playsInline
        poster={posterUrl || DEFAULT_HERO_POSTER_URL}
        preload="auto"
        // key forces the <video> to remount (and reload the new source)
        // when an admin swaps the hero video in Sanity, rather than the
        // browser continuing to play whatever it already buffered.
        key={videoUrl ?? DEFAULT_HERO_VIDEO_URL}
      >
        <source src={videoUrl || DEFAULT_HERO_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="cinematic-hero-overlay" />
      <div className="cinematic-hero-content">
        <p>{tagline || DEFAULT_TAGLINE}</p>
        <h1 className="sr-only">LEYROS Luxury Fragrance House</h1>
        <Link href="#cinematic-collection" className="cinematic-outline-button">Discover the collection</Link>
      </div>
    </section>
  );
}
