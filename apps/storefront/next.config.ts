import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets Next.js process the sanity-studio workspace package's TypeScript
  // schema files directly (they're consumed as source, not a pre-built
  // package) — powers the embedded Studio at /admin, which reuses the same
  // schemas as the standalone apps/sanity-studio deployment rather than
  // duplicating them.
  transpilePackages: ["sanity-studio"],
  // The cart and checkout live entirely in the cart drawer; old page URLs go home.
  async redirects() {
    return [
      { source: "/cart", destination: "/", permanent: false },
      { source: "/checkout/details", destination: "/", permanent: false },
      { source: "/checkout/payment", destination: "/", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      // Demo/seed imagery (plan §9 Phase 1 verification) — replace with real
      // product photography before launch.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage (plan §2) — public bucket URLs live on this domain.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Sanity's image CDN — product photos now live here (see lib/data/products.ts).
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
};

export default nextConfig;
