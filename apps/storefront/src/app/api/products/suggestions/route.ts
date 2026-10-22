import { NextRequest, NextResponse } from "next/server";
import { getSimilarProducts } from "@/lib/data/products";
import { defaultVariant } from "@/lib/variants";

// Backs the cart drawer's "You might also like" row. POST with the cart's
// product IDs for real similarity-based suggestions (same category/family/
// tags as what's actually in the cart); GET with no body falls back to
// best sellers, e.g. for a first render before the cart is known.
async function respondWith(cartProductIds: string[], interestProductIds: string[] = []) {
  const products = await getSimilarProducts(cartProductIds, 10, interestProductIds);
  return NextResponse.json({
    products: products.map((product) => ({ product, variant: defaultVariant(product.variants) })).map(({ product, variant }) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      category: product.category,
      image: product.images[0],
      variant: variant
        ? { id: variant.id, sku: variant.sku, sizeMl: variant.sizeMl, sizeLabel: variant.sizeLabel, price: variant.price, compareAtPrice: variant.compareAtPrice }
        : null,
    })),
  });
}

export async function GET() {
  return respondWith([]);
}

export async function POST(request: NextRequest) {
  let body: { cartProductIds?: string[]; interestProductIds?: string[] };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  return respondWith(
    Array.isArray(body.cartProductIds) ? body.cartProductIds : [],
    Array.isArray(body.interestProductIds) ? body.interestProductIds : [],
  );
}
