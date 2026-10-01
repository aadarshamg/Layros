import type { MetadataRoute } from "next";
import { sanityClient, sanityConfigured } from "@/lib/sanity";

export const revalidate = 3600;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leyros.in").replace(/\/$/, "");

const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/collections/all", priority: 0.9, changeFrequency: "daily" },
  { path: "/candles", priority: 0.8, changeFrequency: "weekly" },
  { path: "/private-blends", priority: 0.7, changeFrequency: "weekly" },
  { path: "/samples", priority: 0.7, changeFrequency: "weekly" },
  { path: "/gifting", priority: 0.6, changeFrequency: "monthly" },
  { path: "/fragrance-finder", priority: 0.6, changeFrequency: "monthly" },
  { path: "/story", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/legal/shipping-returns", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${siteUrl}${page.path === "/" ? "" : page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  if (!sanityConfigured) return pages;
  try {
    // Sample listings (details.sampleOfProduct) aren't browsable on their own, same rule as the shop grids.
    const products = await sanityClient.fetch<{ handle: string; updatedAt: string }[]>(
      `*[_type == "product" && defined(slug.current) && !defined(details.sampleOfProduct)]{ "handle": slug.current, "updatedAt": _updatedAt }`,
    );
    for (const product of products) {
      pages.push({
        url: `${siteUrl}/products/${product.handle}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("sitemap: product fetch failed", error);
  }
  return pages;
}
