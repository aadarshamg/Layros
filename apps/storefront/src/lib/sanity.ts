import { createClient } from "next-sanity";

// Falls back to a placeholder id rather than throwing, so the storefront
// still boots before the Sanity project exists (plan §2 step 7) — callers
// that query it should expect and handle failures (see lib/data/*).
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const sanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: true,
});
