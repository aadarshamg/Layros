import "server-only";
import { sanityClient, sanityConfigured, urlForImage, SANITY_FETCH_OPTIONS } from "@/lib/sanity";
import type { PerfumeProduct } from "@leyros/types";
import { PRODUCT_PROJECTION, toPerfumeProduct, type RawSanityProduct } from "@/lib/data/products";
import type { SanityImageSource } from "@sanity/image-url";

export interface TrialSet {
  id: string;
  label: string;
  tagline?: string;
  image?: string;
  product: PerfumeProduct;
}

interface RawTrialSet {
  id: string;
  label?: string | null;
  tagline?: string | null;
  image?: SanityImageSource | null;
  product?: RawSanityProduct | null;
}

// Like shoppable videos: no fallback data — the section only renders once an
// admin has added Trial Sets in Sanity.
export async function getTrialSets(): Promise<TrialSet[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await sanityClient.fetch<RawTrialSet[]>(
      `*[_type == "trialSet" && defined(product) && defined(label)] | order(order asc) {
        "id": _id,
        label,
        tagline,
        image,
        "product": product->${PRODUCT_PROJECTION}
      }`,
      {},
      SANITY_FETCH_OPTIONS,
    );
    return raw
      .filter((entry): entry is RawTrialSet & { label: string; product: RawSanityProduct } => !!entry.label && !!entry.product)
      .map((entry) => {
        const product = toPerfumeProduct(entry.product);
        return {
          id: entry.id,
          label: entry.label,
          tagline: entry.tagline ?? undefined,
          image: entry.image ? urlForImage(entry.image).width(900).height(900).fit("crop").url() : product.images[0],
          product,
        };
      })
      .filter((entry) => entry.product.variants.length > 0);
  } catch (error) {
    console.error("getTrialSets failed:", error);
    return [];
  }
}
