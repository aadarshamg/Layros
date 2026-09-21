import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Demo/seed imagery (plan §9 Phase 1 verification) — replace with real
      // product photography before launch.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage (plan §2) — public bucket URLs live on this domain.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
