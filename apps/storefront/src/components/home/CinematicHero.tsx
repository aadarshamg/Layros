import Link from "next/link";
import { DEFAULT_TAGLINE, DEFAULT_HERO_VIDEO_URL, DEFAULT_HERO_POSTER_URL } from "@/lib/site-defaults";

export function CinematicHero({ tagline, videoUrl, posterUrl }: { tagline?: string; videoUrl?: string; posterUrl?: string }) {
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
