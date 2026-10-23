import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/data/products";

// Product details for ids saved in the browser (the wishlist page).
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[\w.-]{1,120}$/.test(id))
    .slice(0, 60);
  return NextResponse.json({ products: await getProductsByIds(ids) });
}
