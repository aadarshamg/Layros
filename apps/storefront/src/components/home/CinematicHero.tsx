import { DEFAULT_HERO_VIDEO_URL } from "@/lib/site-defaults";

export function CinematicHero({ videoUrl, posterUrl }: { tagline?: string; videoUrl?: string; posterUrl?: string }) {
  const source = videoUrl || DEFAULT_HERO_VIDEO_URL;
  return (
    <section className="signature-hero signature-video-hero" aria-labelledby="signature-hero-title">
      <h1 id="signature-hero-title" className="sr-only">Leyros Luxury Fragrance House</h1>
      <video
        key={source}
        className="signature-hero-video"
        autoPlay
        loop
        muted
        playsInline
        poster={posterUrl}
        preload="metadata"
        aria-label="Leyros hero film"
      >
        <source src={source} type="video/mp4" />
      </video>
    </section>
  );
}
