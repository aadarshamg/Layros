import type { PerfumeProduct } from "@leyros/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function productJsonLd(
  product: PerfumeProduct,
  rating?: { value: number; count: number },
) {
  const isFragrance = !product.category || /perfume|attar/i.test(product.category);
  const absoluteImages = product.images.map((image) => image.startsWith("http") ? image : `${siteUrl}${image}`);
  const additionalProperty = isFragrance
    ? [
        { "@type": "PropertyValue", name: "Fragrance family", value: product.details.family },
        { "@type": "PropertyValue", name: "Gender", value: product.details.gender },
        { "@type": "PropertyValue", name: "Concentration", value: product.details.concentration },
        { "@type": "PropertyValue", name: "Top notes", value: product.details.notesTop.join(", ") },
        { "@type": "PropertyValue", name: "Heart notes", value: product.details.notesHeart.join(", ") },
        { "@type": "PropertyValue", name: "Base notes", value: product.details.notesBase.join(", ") },
      ].filter((property) => property.value)
    : [
        { "@type": "PropertyValue", name: "Product category", value: product.category },
        { "@type": "PropertyValue", name: "Features", value: product.tags.join(", ") },
      ].filter((property) => property.value);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    brand: { "@type": "Brand", name: "LEYROS" },
    description: product.description,
    image: absoluteImages,
    category: product.category,
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
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "LEYROS" },
      url: `${siteUrl}/products/${product.handle}`,
    })),
    additionalProperty,
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
