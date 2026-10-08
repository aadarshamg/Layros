import Image from "next/image";
import Link from "next/link";
import { DEFAULT_TAGLINE, DEFAULT_HERO_VIDEO_URL, DEFAULT_HERO_POSTER_URL, HERO_BANNER } from "@/lib/site-defaults";

export function CinematicHero({ tagline, videoUrl, posterUrl }: { tagline?: string; videoUrl?: string; posterUrl?: string }) {
  if (HERO_BANNER) {
    return (
      <section className="signature-hero" aria-labelledby="signature-hero-title">
        <div className="signature-hero-stage">
          <h1 id="signature-hero-title">LEYROS</h1>
          <Link href={HERO_BANNER.href} className="signature-hero-bottle" aria-label="Discover Leyros signature fragrances">
            <Image
              src="/leyros/aqualis-floating-v4.png"
              alt="Leyros Aqualis perfume floating in glass with a silver atomizer"
              fill
              priority
              sizes="(max-width: 700px) 85vw, 480px"
            />
          </Link>
        </div>
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
