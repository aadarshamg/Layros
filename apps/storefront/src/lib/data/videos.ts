import "server-only";
import { sanityClient, sanityConfigured, urlForImage, SANITY_FETCH_OPTIONS } from "@/lib/sanity";
import type { ShoppableVideo } from "@leyros/types";
import { PRODUCT_PROJECTION, toPerfumeProduct, type RawSanityProduct } from "@/lib/data/products";
import type { SanityImageSource } from "@sanity/image-url";

interface RawShoppableVideo {
  id: string;
  videoFileUrl?: string | null;
  videoUrl?: string | null;
  creatorHandle?: string | null;
  creatorAvatar?: SanityImageSource | null;
  promoBadge?: string | null;
  order?: number | null;
  product?: RawSanityProduct | null;
}

const SHOPPABLE_VIDEO_PROJECTION = `{
  "id": _id,
  "videoFileUrl": videoFile.asset->url,
  videoUrl,
  creatorHandle,
  creatorAvatar,
  promoBadge,
  order,
  "product": product->${PRODUCT_PROJECTION}
}`;

// No editorial/fallback data here (unlike products) — this section simply
// doesn't render if Sanity has no entries yet, rather than showing fake
// creator content.
export async function getShoppableVideos(): Promise<ShoppableVideo[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await sanityClient.fetch<RawShoppableVideo[]>(
      `*[_type == "shoppableVideo" && defined(product)] | order(order asc) ${SHOPPABLE_VIDEO_PROJECTION}`,
      {},
      SANITY_FETCH_OPTIONS,
    );
    return raw
      .filter((entry): entry is RawShoppableVideo & { product: RawSanityProduct } => !!entry.product && !!(entry.videoFileUrl || entry.videoUrl))
      .map((entry) => ({
        id: entry.id,
        // An uploaded video (native Sanity asset) always wins over the
        // legacy externally-hosted URL field when both happen to be set.
        videoUrl: (entry.videoFileUrl || entry.videoUrl) as string,
        creatorHandle: entry.creatorHandle ?? undefined,
        creatorAvatar: entry.creatorAvatar ? urlForImage(entry.creatorAvatar).width(80).height(80).fit("crop").url() : undefined,
        promoBadge: entry.promoBadge ?? undefined,
        order: entry.order ?? 0,
        product: toPerfumeProduct(entry.product),
      }));
  } catch (error) {
    console.error("getShoppableVideos failed:", error);
    return [];
  }
}
