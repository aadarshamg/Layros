import "server-only";
import { createClient } from "next-sanity";
import { sanityClient, sanityConfigured, SANITY_FETCH_OPTIONS } from "@/lib/sanity";
import { sha256Hex } from "@/lib/auth/crypto";

export interface ProductReview {
  id: string;
  name: string;
  rating: number;
  comment?: string;
  submittedAt?: string;
  /** "google" when imported from a Google review that names this product. */
  source?: "website" | "google";
  /** Photos and videos the reviewer attached. */
  media?: { kind: "image" | "video"; url: string }[];
}

/** A file attached to a submitted review, already checked by the API route. */
export interface ReviewUpload {
  kind: "image" | "video";
  filename: string;
  contentType: string;
  data: Buffer;
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

const writeClient =
  projectId && token ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false }) : null;

export async function getApprovedReviews(productId: string): Promise<ProductReview[]> {
  if (!sanityConfigured) return [];
  try {
    return await sanityClient.fetch<ProductReview[]>(
      `*[_type == "productReview" && approved == true && product._ref == $productId] | order(submittedAt desc) [0...30] {
        "id": _id, name, rating, comment, submittedAt, source,
        "media": media[]{ "kind": select(_type == "file" => "video", "image"), "url": asset->url }
      }`,
      { productId },
      SANITY_FETCH_OPTIONS,
    );
  } catch (error) {
    console.error("getApprovedReviews failed:", error);
    return [];
  }
}

export type SubmitReviewResult = { ok: true } | { ok: false; reason: "unavailable" | "unknown-product" | "duplicate" };

/**
 * Saves a pending review. The document id is derived from the (already hashed)
 * visitor IP + product, so each visitor can leave one review per product —
 * a resubmission is rejected rather than stacking duplicates.
 */
export async function submitReview(input: {
  productId: string;
  name: string;
  rating: number;
  comment: string;
  ipHash: string;
  uploads?: ReviewUpload[];
}): Promise<SubmitReviewResult> {
  if (!writeClient) return { ok: false, reason: "unavailable" };

  const productExists = await writeClient.fetch<boolean>(`defined(*[_type == "product" && _id == $id][0]._id)`, { id: input.productId });
  if (!productExists) return { ok: false, reason: "unknown-product" };

  const docId = `productReview-${sha256Hex(`${input.ipHash}:${input.productId}`).slice(0, 32)}`;
  const existing = await writeClient.fetch<string | null>(`*[_id == $id][0]._id`, { id: docId });
  if (existing) return { ok: false, reason: "duplicate" };

  // Upload attachments only once the review is known to be new and valid.
  const media = [];
  for (const [index, upload] of (input.uploads ?? []).entries()) {
    const asset = await writeClient.assets.upload(upload.kind === "video" ? "file" : "image", upload.data, { filename: upload.filename, contentType: upload.contentType });
    media.push({ _type: upload.kind === "video" ? "file" : "image", _key: `m${index}`, asset: { _type: "reference", _ref: asset._id } });
  }

  await writeClient.createIfNotExists({
    _id: docId,
    _type: "productReview",
    ...(media.length && { media }),
    approved: false,
    product: { _type: "reference", _ref: input.productId, _weak: true },
    name: input.name,
    rating: input.rating,
    comment: input.comment || undefined,
    submittedAt: new Date().toISOString(),
  });
  return { ok: true };
}
