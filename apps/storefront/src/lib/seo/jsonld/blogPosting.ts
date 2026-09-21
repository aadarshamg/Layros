import type { SanityPost } from "@leyros/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function blogPostingJsonLd(post: SanityPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.mainImage,
    datePublished: post.publishedAt,
    author: post.authorName ? { "@type": "Person", name: post.authorName } : undefined,
    url: `${siteUrl}/journal/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "LEYROS",
    },
  };
}
