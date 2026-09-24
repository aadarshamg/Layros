import { getShoppableVideos } from "@/lib/data/videos";
import { VideoShowcaseCarousel } from "@/components/home/VideoShowcaseCarousel";

export async function VideoShowcase() {
  const videos = await getShoppableVideos();
  if (videos.length === 0) return null;

  return (
    <section className="home-reels" aria-labelledby="home-reels-title">
      <div className="cinematic-shell">
        <header className="home-reels-heading">
          <div>
            <p>Seen in motion</p>
            <h2 id="home-reels-title">The Leyros Reels</h2>
          </div>
          <span>Watch. Discover. Shop.</span>
        </header>
        <VideoShowcaseCarousel videos={videos} />
      </div>
    </section>
  );
}
