import { getShoppableVideos } from "@/lib/data/videos";
import { VideoShowcaseCarousel } from "@/components/home/VideoShowcaseCarousel";

export async function VideoShowcase() {
  const videos = await getShoppableVideos();
  if (videos.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-center text-xs uppercase tracking-widest text-charcoal-soft/60">Shop from videos</p>
      <h2 className="mt-2 text-center font-serif text-3xl">See What the Hype&rsquo;s About</h2>
      <VideoShowcaseCarousel videos={videos} />
    </section>
  );
}
