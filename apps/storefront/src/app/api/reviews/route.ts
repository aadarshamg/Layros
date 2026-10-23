import { NextRequest, NextResponse } from "next/server";
import { submitReviewSchema } from "@/lib/validation/review";
import { hashIp } from "@/lib/auth/rate-limit";
import { submitReview, type ReviewUpload } from "@/lib/data/reviews";

// Vercel caps a request at about 4.5 MB, so attachments must fit under it
// together (the form shrinks photos in the browser first).
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 4.3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

async function readUploads(form: FormData): Promise<ReviewUpload[] | { error: string }> {
  const files = form.getAll("media").filter((value): value is File => value instanceof File && value.size > 0);
  const photos = files.filter((file) => PHOTO_TYPES.includes(file.type));
  const videos = files.filter((file) => VIDEO_TYPES.includes(file.type));
  if (photos.length + videos.length !== files.length) return { error: "Photos must be JPG, PNG or WebP, and videos MP4, MOV or WebM." };
  if (photos.length > MAX_PHOTOS || videos.length > 1) return { error: `Add up to ${MAX_PHOTOS} photos and 1 video.` };
  if (photos.some((file) => file.size > MAX_PHOTO_BYTES)) return { error: "One of the photos is too large. Please try a smaller one." };
  if (videos.some((file) => file.size > MAX_VIDEO_BYTES)) return { error: "Videos can be up to 4 MB. Please trim it to a short clip." };
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) return { error: "The attachments are too large together. Please remove one." };
  return Promise.all(files.map(async (file, index) => ({
    kind: VIDEO_TYPES.includes(file.type) ? "video" as const : "image" as const,
    filename: `review-${Date.now()}-${index}.${file.type.split("/")[1].replace("quicktime", "mov")}`,
    contentType: file.type,
    data: Buffer.from(await file.arrayBuffer()),
  })));
}

export async function POST(request: NextRequest) {
  let body: unknown;
  let uploads: ReviewUpload[] = [];
  try {
    if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await request.formData();
      body = {
        productId: String(form.get("productId") ?? ""),
        name: String(form.get("name") ?? ""),
        rating: Number(form.get("rating") ?? 0),
        comment: String(form.get("comment") ?? ""),
        website: String(form.get("website") ?? ""),
      };
      const read = await readUploads(form);
      if ("error" in read) return NextResponse.json({ error: read.error }, { status: 400 });
      uploads = read;
    } else {
      body = await request.json();
    }
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = submitReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your review and try again." }, { status: 400 });
  }
  // Bots that fill the hidden field get a normal-looking success and nothing is stored.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const result = await submitReview({
    productId: parsed.data.productId,
    name: parsed.data.name,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    ipHash: hashIp(getClientIp(request)),
    uploads,
  });

  if (!result.ok) {
    if (result.reason === "duplicate") {
      return NextResponse.json({ error: "You've already reviewed this product. Thank you!" }, { status: 409 });
    }
    if (result.reason === "unknown-product") {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Reviews are unavailable right now. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
