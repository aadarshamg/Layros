import { NextRequest, NextResponse } from "next/server";
import { submitReviewSchema } from "@/lib/validation/review";
import { hashIp } from "@/lib/auth/rate-limit";
import { submitReview } from "@/lib/data/reviews";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
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
  });

  if (!result.ok) {
    if (result.reason === "duplicate") {
      return NextResponse.json({ error: "You've already reviewed this product — thank you!" }, { status: 409 });
    }
    if (result.reason === "unknown-product") {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Reviews are unavailable right now. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
