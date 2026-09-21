import type { PerfumeProduct } from "@leyros/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function productJsonLd(
  product: PerfumeProduct,
  rating?: { value: number; count: number },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    brand: { "@type": "Brand", name: "LEYROS" },
    description: product.description,
    image: product.images,
    sku: product.variants[0]?.sku,
    url: `${siteUrl}/products/${product.handle}`,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      priceCurrency: "INR",
      price: variant.price,
      sku: variant.sku,
      availability:
        variant.inventoryQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/products/${product.handle}`,
    })),
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.value,
            reviewCount: rating.count,
          },
        }
      : {}),
  };
}
