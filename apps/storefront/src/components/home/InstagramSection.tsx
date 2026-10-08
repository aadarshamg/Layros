import Image from "next/image";
import Link from "next/link";
import type { PerfumeProduct } from "@leyros/types";
import { getInstagramPosts } from "@/lib/data/instagram";

const PROFILE_URL = "https://www.instagram.com/leyrosperfume/";

export async function InstagramSection({ products }: { products: PerfumeProduct[] }) {
  const posts = await getInstagramPosts(6);
  // Until an Instagram account is connected (INSTAGRAM_ACCESS_TOKEN), show product photos instead of an empty section.
  const fallback = posts.length ? [] : products.filter((product) => product.images[0]).slice(0, 6);
  if (!posts.length && !fallback.length) return null;

  return (
    <section className="home-instagram" aria-labelledby="home-instagram-title">
      <div className="cinematic-shell">
        <header>
          <div><span>Follow the fragrance journal</span><h2 id="home-instagram-title">@leyrosperfume</h2></div>
          <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">Follow on Instagram</a>
        </header>
        <div className="home-instagram-grid">
          {posts.map((post) => (
            <a href={post.permalink} key={post.id} target="_blank" rel="noopener noreferrer" aria-label={`Open Instagram post${post.caption ? `: ${post.caption.slice(0, 80)}` : ""}`}>
              <Image src={post.image} alt={post.caption?.slice(0, 120) || "Instagram post by @leyrosperfume"} fill sizes="(max-width: 650px) 33vw, 16vw" />
              {post.isVideo && <i className="home-instagram-video" aria-hidden="true">▶</i>}
              <span aria-hidden="true">View on Instagram</span>
            </a>
          ))}
          {fallback.map((product) => (
            <Link href={`/products/${product.handle}`} key={product.id} aria-label={`View ${product.title}`}>
              <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 650px) 33vw, 16vw" />
              <span aria-hidden="true">View product</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
