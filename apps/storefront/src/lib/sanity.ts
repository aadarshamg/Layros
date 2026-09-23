import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

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

// Passed as the third argument to every sanityClient.fetch() call in
// lib/data/* — without this, Next.js's fetch cache holds the result
// indefinitely (this route has no dynamic APIs, so it's static-eligible),
// and edits made in Sanity Studio wouldn't show up on the live site until
// the next deploy. 60s keeps pages fast while still picking up content
// edits within a minute.
export const SANITY_FETCH_OPTIONS = { next: { revalidate: 60 } };

const builder = createImageUrlBuilder(sanityClient);

/** Turns a Sanity image reference into a servable URL, sized for the web. */
export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
