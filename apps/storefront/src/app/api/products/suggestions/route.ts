import { NextRequest, NextResponse } from "next/server";
import { getSimilarProducts } from "@/lib/data/products";

// Backs the cart drawer's "You might also like" row. POST with the cart's
// product IDs for real similarity-based suggestions (same category/family/
// tags as what's actually in the cart); GET with no body falls back to
// best sellers, e.g. for a first render before the cart is known.
async function respondWith(cartProductIds: string[], interestProductIds: string[] = []) {
  const products = await getSimilarProducts(cartProductIds, 10, interestProductIds);
  return NextResponse.json({
    products: products.map((product) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      image: product.images[0],
      variant: product.variants[0]
        ? {
            id: product.variants[0].id,
            sku: product.variants[0].sku,
            sizeMl: product.variants[0].sizeMl,
            sizeLabel: product.variants[0].sizeLabel,
            price: product.variants[0].price,
            compareAtPrice: product.variants[0].compareAtPrice,
          }
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
