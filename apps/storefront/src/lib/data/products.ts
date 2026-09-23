import "server-only";
import { sanityClient, sanityConfigured, urlForImage, SANITY_FETCH_OPTIONS } from "@/lib/sanity";
import type { FragranceFamily, PerfumeProduct, PerfumeVariant } from "@leyros/types";
import { editorialProducts } from "@/lib/data/editorial-products";
import type { SanityImageSource } from "@sanity/image-url";

/** Raw shape returned by the GROQ projection below — mirrors the `product` schema. */
export interface RawSanityProduct {
  id: string;
  handle: string | null;
  title: string;
  brand?: string | null;
  description?: string | null;
  createdAt: string;
  images?: SanityImageSource[] | null;
  galleryVideoUrl?: string | null;
  videoFileUrl?: string | null;
  videoUrl?: string | null;
  tags?: string[] | null;
  category?: string | null;
  variants?:
    | {
        id: string;
        sizeMl?: number | null;
        sizeLabel?: string | null;
        sku?: string | null;
        price?: number | null;
        compareAtPrice?: number | null;
        inventoryQuantity?: number | null;
      }[]
    | null;
  details?: {
    concentration?: "EDT" | "EDP" | "PARFUM" | null;
    family?: "floral" | "woody" | "oriental" | "fresh" | "gourmand" | null;
    gender?: "feminine" | "masculine" | "unisex" | null;
    intensity?: "light" | "moderate" | "strong" | null;
    notesTop?: string[] | null;
    notesHeart?: string[] | null;
    notesBase?: string[] | null;
    perfumer?: string | null;
    story?: string | null;
    isLimited?: boolean | null;
    sampleEligible?: boolean | null;
    sampleOfProductId?: string | null;
  } | null;
}

// Keep in sync with the `product` schema in apps/sanity-studio/schemas/product.ts.
export const PRODUCT_PROJECTION = `{
  "id": _id,
  "handle": slug.current,
  title,
  brand,
  description,
  "createdAt": _createdAt,
  "images": images[_type == "image"],
  // Admin can drop one video in among the gallery photos (any position) —
  // this pulls it out and resolves its asset URL, wherever it was placed.
  "galleryVideoUrl": images[_type == "video"][0].asset->url,
  "videoFileUrl": videoFile.asset->url,
  videoUrl,
  tags,
  category,
  variants[]{
    "id": _key,
    sizeMl,
    sizeLabel,
    sku,
    price,
    compareAtPrice,
    inventoryQuantity
  },
  details{
    concentration,
    family,
    gender,
    intensity,
    notesTop,
    notesHeart,
    notesBase,
    perfumer,
    story,
    isLimited,
    sampleEligible,
    "sampleOfProductId": sampleOfProduct._ref
  }
}`;

export function toPerfumeProduct(raw: RawSanityProduct): PerfumeProduct {
  const variants: PerfumeVariant[] = (raw.variants ?? []).map((variant) => ({
    id: variant.id,
    sizeMl: (variant.sizeMl ?? 50) as 30 | 50 | 100,
    sizeLabel: variant.sizeLabel ?? undefined,
    sku: variant.sku ?? "",
    price: variant.price ?? 0,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    inventoryQuantity: variant.inventoryQuantity ?? 0,
  }));

  const images = (raw.images ?? [])
    .map((image) => {
      try {
        return urlForImage(image).width(1600).fit("max").url();
      } catch {
        return null;
      }
    })
    .filter((url): url is string => !!url);

  return {
    id: raw.id,
    handle: raw.handle ?? raw.id,
    title: raw.title,
    brand: raw.brand ?? "Leyros",
    description: raw.description ?? "",
    images,
    // Priority: a video dropped into the image gallery itself (the current,
    // recommended way to add one) > the legacy dedicated upload field > the
    // legacy externally-hosted URL field.
    videoUrl: raw.galleryVideoUrl ?? raw.videoFileUrl ?? raw.videoUrl ?? undefined,
    variants,
    tags: raw.tags ?? [],
    category: raw.category ?? undefined,
    createdAt: raw.createdAt,
    details: {
      concentration: raw.details?.concentration ?? "EDP",
      family: raw.details?.family ?? "floral",
      gender: raw.details?.gender ?? "unisex",
      intensity: raw.details?.intensity ?? "moderate",
      notesTop: raw.details?.notesTop ?? [],
      notesHeart: raw.details?.notesHeart ?? [],
      notesBase: raw.details?.notesBase ?? [],
      perfumer: raw.details?.perfumer ?? undefined,
      story: raw.details?.story ?? undefined,
      isLimited: raw.details?.isLimited ?? false,
      sampleEligible: raw.details?.sampleEligible ?? false,
      sampleOfProductId: raw.details?.sampleOfProductId ?? undefined,
    },
  };
}

// A product that IS a sample listing (its details.sampleOfProduct points at
// the full-size product it samples) is excluded from general browsing grids
// (PLP/best-sellers/new-arrivals), same as the old Medusa "-sample" handle
// convention — it's still directly reachable via its own handle.
function isBrowsableFragrance(raw: RawSanityProduct) {
  return !raw.details?.sampleOfProductId;
}

async function fetchAllProducts(): Promise<RawSanityProduct[]> {
  if (!sanityConfigured) throw new Error("Sanity isn't configured yet — use the editorial catalogue.");
  return sanityClient.fetch<RawSanityProduct[]>(`*[_type == "product"] ${PRODUCT_PROJECTION}`, {}, SANITY_FETCH_OPTIONS);
}

const BESTSELLER_TAG = "bestseller";

export async function getBestSellers(limit = 4): Promise<PerfumeProduct[]> {
  try {
    const raw = await fetchAllProducts();
    const browsable = raw.filter(isBrowsableFragrance).map(toPerfumeProduct);
    const bestsellers = browsable.filter((product) =>
      product.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG),
    );
    return bestsellers.slice(0, limit);
  } catch {
    // Sanity isn't reachable/configured yet — render the page without this
    // section rather than failing the build.
    return editorialProducts
      .filter((product) => product.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG))
      .slice(0, limit);
  }
}

export async function getNewArrivals(limit = 4): Promise<PerfumeProduct[]> {
  try {
    const raw = await fetchAllProducts();
    const browsable = raw.filter(isBrowsableFragrance).map(toPerfumeProduct);
    return browsable.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  } catch {
    return [...editorialProducts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}

export interface ProductOfMonthResult {
  product: PerfumeProduct;
  unitsSold: number;
  isSalesBased: boolean;
}

interface MonthlyOrderRow {
  items?: { sku?: string | null; quantity?: number | null }[] | null;
}

/**
 * Selects the product with the highest number of units ordered during the
 * current calendar month. Paid online orders and placed COD orders count;
 * known failed payments do not. A tagged bestseller is used only until the
 * store has enough monthly order data to produce a winner.
 */
export async function getProductOfMonth(): Promise<ProductOfMonthResult | null> {
  let products: PerfumeProduct[];
  try {
    const raw = await fetchAllProducts();
    products = raw.filter(isBrowsableFragrance).map(toPerfumeProduct);
  } catch {
    products = editorialProducts.filter((product) => !product.details.sampleOfProductId);
  }

  if (products.length === 0) return null;

  if (sanityConfigured) {
    try {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const orders = await sanityClient.fetch<MonthlyOrderRow[]>(
        `*[_type == "order" && _createdAt >= $monthStart && paymentStatus != "failed"] {
          items[]{sku, quantity}
        }`,
        { monthStart },
        SANITY_FETCH_OPTIONS,
      );
      const unitsBySku = new Map<string, number>();
      for (const order of orders) {
        for (const item of order.items ?? []) {
          if (!item.sku) continue;
          unitsBySku.set(item.sku, (unitsBySku.get(item.sku) ?? 0) + Math.max(0, item.quantity ?? 0));
        }
      }

      const ranked = products
        .map((product) => ({
          product,
          unitsSold: product.variants.reduce((sum, variant) => sum + (unitsBySku.get(variant.sku) ?? 0), 0),
        }))
        .sort((a, b) => b.unitsSold - a.unitsSold);
      if (ranked[0]?.unitsSold > 0) return { ...ranked[0], isSalesBased: true };
    } catch {
      // Keep the homepage available if order analytics are private or Sanity
      // is temporarily unavailable; the merchandising fallback below is safe.
    }
  }

  const fallback =
    products.find((product) => product.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG)) ??
    [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return fallback ? { product: fallback, unitsSold: 0, isSalesBased: false } : null;
}

/**
 * Content-based "you might also like": scores every other product by how
 * much it has in common with what's actually in the cart right now (same
 * merchandising category, same fragrance family, shared tags), rather than
 * a generic best-sellers list. This is deliberately NOT collaborative
 * filtering ("customers who bought X also bought Y") — the site is too new
 * to have enough real order history for that to mean anything yet; this
 * scores on product similarity instead, which works from day one.
 */
export async function getSimilarProducts(
  cartProductIds: string[],
  limit = 6,
  interestProductIds: string[] = [],
): Promise<PerfumeProduct[]> {
  try {
    const raw = await fetchAllProducts();
    const browsable = raw.filter(isBrowsableFragrance).map(toPerfumeProduct);
    const inCart = new Set(cartProductIds);
    const interestSeeds = new Set([...cartProductIds, ...interestProductIds]);
    const cartItems = browsable.filter((product) => interestSeeds.has(product.id));

    const excluded = new Set(cartProductIds);
    const results: PerfumeProduct[] = [];

    if (cartItems.length > 0) {
      const cartCategories = new Set(cartItems.map((p) => p.category).filter(Boolean));
      const cartFamilies = new Set(cartItems.map((p) => p.details.family));
      const cartTags = new Set(cartItems.flatMap((p) => p.tags.map((t) => t.toLowerCase())));

      const scored = browsable
        .filter((product) => !excluded.has(product.id))
        .map((product) => {
          let score = 0;
          if (product.category && cartCategories.has(product.category)) score += 3;
          if (cartFamilies.has(product.details.family)) score += 2;
          score += product.tags.filter((t) => cartTags.has(t.toLowerCase())).length;
          return { product, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || b.product.createdAt.localeCompare(a.product.createdAt));

      for (const entry of scored) {
        if (results.length >= limit) break;
        results.push(entry.product);
        excluded.add(entry.product.id);
      }
    }

    // Not enough real similarity matches (small catalog corner, a one-off
    // category, or an empty cart) to fill the row on their own — top up
    // with best sellers, then with anything else browsable, so the row
    // always reaches `limit` rather than trailing off to two or three cards.
    if (results.length < limit) {
      const bestSellers = await getBestSellers(browsable.length);
      for (const product of bestSellers) {
        if (results.length >= limit) break;
        if (excluded.has(product.id)) continue;
        results.push(product);
        excluded.add(product.id);
      }
    }
    if (results.length < limit) {
      const rest = [...browsable].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      for (const product of rest) {
        if (results.length >= limit) break;
        if (excluded.has(product.id)) continue;
        results.push(product);
        excluded.add(product.id);
      }
    }
    return results;
  } catch {
    // Keep recommendations personal and fully populated when Sanity is
    // unavailable (including local development and build previews).
    const inCart = new Set(cartProductIds);
    const interestSeeds = new Set([...cartProductIds, ...interestProductIds]);
    const cartItems = editorialProducts.filter((product) => interestSeeds.has(product.id));
    const cartCategories = new Set(
      cartItems.map((product) => product.category?.toLowerCase()).filter(Boolean),
    );
    const cartFamilies = new Set(cartItems.map((product) => product.details.family));
    const cartTags = new Set(
      cartItems.flatMap((product) => product.tags.map((tag) => tag.toLowerCase())),
    );

    return editorialProducts
      .filter((product) => !inCart.has(product.id) && !product.details.sampleOfProductId)
      .map((product) => {
        let score = 0;
        if (product.category && cartCategories.has(product.category.toLowerCase())) score += 4;
        if (cartFamilies.has(product.details.family)) score += 3;
        score += product.tags.filter((tag) => cartTags.has(tag.toLowerCase())).length * 2;

        // Bestseller status is only a tie-breaker; the shopper's interests
        // remain the strongest signal.
        const isBestseller = product.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG);
        return { product, score, isBestseller };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.isBestseller) - Number(a.isBestseller) ||
          b.product.createdAt.localeCompare(a.product.createdAt),
      )
      .slice(0, limit)
      .map(({ product }) => product);
  }
}

export interface FamilyShowcaseEntry {
  family: FragranceFamily;
  product: PerfumeProduct;
}

export interface CategoryShowcaseEntry {
  label: string;
  value: string;
  image: string;
  productCount: number;
}

const HOME_CATEGORIES = [
  { label: "Perfumes", value: "collections", fallbackImage: "/leyros/nuit-doree-hero.jpg" },
  { label: "Attars", value: "attar", fallbackImage: "/leyros/rose.jpg" },
  { label: "Car Perfumes", value: "car perfume", fallbackImage: "/leyros/sandalwood.jpg" },
  { label: "Candles", value: "candle", fallbackImage: "/leyros/candle.jpg" },
  { label: "Gift Packs", value: "gift pack", fallbackImage: "/leyros/coffret.jpg" },
] as const;

const ALL_FAMILIES: FragranceFamily[] = ["floral", "woody", "oriental", "fresh", "gourmand"];

// One representative product per fragrance family, for the homepage's
// "shop by family" tile grid. Families with no real product yet are simply
// omitted rather than linking to an empty collection page.
export async function getFamilyShowcase(): Promise<FamilyShowcaseEntry[]> {
  const { products } = await listProducts({ limit: 100 });
  return ALL_FAMILIES.flatMap((family) => {
    const product = products.find((p) => p.details.family === family);
    return product ? [{ family, product }] : [];
  });
}

export async function getCategoryShowcase(): Promise<CategoryShowcaseEntry[]> {
  const { products } = await listProducts({ limit: 100 });
  return HOME_CATEGORIES.map((category) => {
    const matches = products.filter((product) =>
      product.category?.toLowerCase().includes(category.value),
    );
    return {
      label: category.label,
      value: category.value,
      image: matches[0]?.images[0] ?? category.fallbackImage,
      productCount: matches.length,
    };
  });
}

export async function getProductByHandle(handle: string): Promise<PerfumeProduct | null> {
  try {
    if (!sanityConfigured) throw new Error("Sanity isn't configured yet — use the editorial catalogue.");
    const raw = await sanityClient.fetch<RawSanityProduct | null>(
      `*[_type == "product" && slug.current == $handle][0] ${PRODUCT_PROJECTION}`,
      { handle },
      SANITY_FETCH_OPTIONS,
    );
    if (!raw) return editorialProducts.find((product) => product.handle === handle) ?? null;
    return toPerfumeProduct(raw);
  } catch {
    return editorialProducts.find((product) => product.handle === handle) ?? null;
  }
}

export async function listProducts(params: {
  family?: string;
  gender?: string;
  category?: string;
  q?: string;
  inStock?: boolean;
  sort?: "recommended" | "new" | "price-asc" | "price-desc";
  limit?: number;
  offset?: number;
} = {}): Promise<{ products: PerfumeProduct[]; count: number }> {
  try {
    const raw = await fetchAllProducts();
    const browsableRaw = raw.filter(isBrowsableFragrance);
    if (browsableRaw.length === 0) {
      throw new Error("Use the editorial catalogue while the Sanity catalogue is empty.");
    }
    let products = browsableRaw.map(toPerfumeProduct);
    if (params.q) {
      const query = params.q.toLowerCase();
      products = products.filter((product) =>
        `${product.title} ${product.description}`.toLowerCase().includes(query),
      );
    }
    if (params.family) {
      products = products.filter((product) => product.details.family === params.family);
    }
    if (params.gender) {
      products = products.filter((product) => product.details.gender === params.gender);
    }
    if (params.category) {
      // Real categories are free text from the migrated catalog (e.g.
      // "Fragrance Candles / Home and Kitchen") — a keyword match, not an
      // exact one, since there's no fixed taxonomy behind them.
      const keyword = params.category.toLowerCase();
      products = products.filter((product) => (product.category ?? "").toLowerCase().includes(keyword));
    }
    if (params.inStock) {
      products = products.filter((product) => product.variants.some((variant) => variant.inventoryQuantity > 0));
    }
    if (!params.sort || params.sort === "recommended") {
      products = [...products].sort((a, b) => {
        const aBest = a.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG);
        const bBest = b.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG);
        return Number(bBest) - Number(aBest) || b.createdAt.localeCompare(a.createdAt);
      });
    } else if (params.sort === "new") {
      products = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (params.sort === "price-asc") {
      products = [...products].sort((a, b) => Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price)));
    } else if (params.sort === "price-desc") {
      products = [...products].sort((a, b) => Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price)));
    }
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 24;
    return { products: products.slice(offset, offset + limit), count: products.length };
  } catch {
    let products = editorialProducts;
    if (params.q) {
      const query = params.q.toLowerCase();
      products = products.filter((product) =>
        `${product.title} ${product.description}`.toLowerCase().includes(query),
      );
    }
    if (params.family) {
      products = products.filter((product) => product.details.family === params.family);
    }
    if (params.gender) {
      products = products.filter((product) => product.details.gender === params.gender);
    }
    if (params.category) {
      const keyword = params.category.toLowerCase();
      products = products.filter((product) => (product.category ?? "").toLowerCase().includes(keyword));
    }
    if (params.inStock) {
      products = products.filter((product) => product.variants.some((variant) => variant.inventoryQuantity > 0));
    }
    if (!params.sort || params.sort === "recommended") {
      products = [...products].sort((a, b) => {
        const aBest = a.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG);
        const bBest = b.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG);
        return Number(bBest) - Number(aBest) || b.createdAt.localeCompare(a.createdAt);
      });
    } else if (params.sort === "new") {
      products = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (params.sort === "price-asc") {
      products = [...products].sort((a, b) => Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price)));
    } else if (params.sort === "price-desc") {
      products = [...products].sort((a, b) => Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price)));
    }
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 24;
    return { products: products.slice(offset, offset + limit), count: products.length };
  }
}
