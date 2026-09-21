import "server-only";
import { medusa } from "@/lib/medusa";
import type { FragranceFamily, PerfumeProduct, PerfumeVariant } from "@leyros/types";
import { editorialProducts } from "@/lib/data/editorial-products";

/** The subset of Medusa's StoreProduct shape this mapping actually reads. */
interface RawMedusaProduct {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  created_at?: string | null;
  images?: { url: string }[] | null;
  tags?: { value: string }[] | null;
  variants?:
    | {
        id: string;
        title?: string | null;
        sku?: string | null;
        inventory_quantity?: number | null;
        calculated_price?: { calculated_amount?: number | null } | null;
      }[]
    | null;
}

/** Raw shape returned by our custom GET /store/perfume-details route. */
interface RawPerfumeDetails {
  product_id: string;
  concentration: "EDT" | "EDP" | "PARFUM";
  family: "floral" | "woody" | "oriental" | "fresh" | "gourmand";
  gender: "feminine" | "masculine" | "unisex";
  intensity: "light" | "moderate" | "strong";
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
  perfumer?: string | null;
  story?: string | null;
  is_limited: boolean;
  sample_eligible: boolean;
  sample_of_product_id?: string | null;
}

/**
 * The product<->perfumeDetails module link only resolves remote-query joins
 * in one direction (see apps/medusa/src/api/store/perfume-details/route.ts
 * for why), so this fetches perfume-details separately and merges them in —
 * rather than getting them for free on the default product routes.
 */
async function fetchPerfumeDetailsMap(productIds: string[]): Promise<Map<string, RawPerfumeDetails>> {
  if (productIds.length === 0) return new Map();
  try {
    const { perfume_details } = await medusa.client.fetch<{ perfume_details: RawPerfumeDetails[] }>(
      "/store/perfume-details",
      { query: { product_id: productIds } },
    );
    return new Map(perfume_details.map((detail) => [detail.product_id, detail]));
  } catch {
    return new Map();
  }
}

function toPerfumeProduct(raw: RawMedusaProduct, details?: RawPerfumeDetails): PerfumeProduct {
  const variants: PerfumeVariant[] = (raw.variants ?? []).map((variant) => ({
    id: variant.id,
    sizeMl: (Number.parseInt(variant.title ?? "", 10) || 50) as 30 | 50 | 100,
    sku: variant.sku ?? "",
    price: variant.calculated_price?.calculated_amount ?? 0,
    inventoryQuantity: variant.inventory_quantity ?? 0,
  }));

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    brand: "Leyros",
    description: raw.description ?? "",
    images: (raw.images ?? []).map((image) => image.url).filter(Boolean),
    variants,
    tags: (raw.tags ?? []).map((tag) => tag.value),
    createdAt: raw.created_at ?? new Date(0).toISOString(),
    details: {
      concentration: details?.concentration ?? "EDP",
      family: details?.family ?? "floral",
      gender: details?.gender ?? "unisex",
      intensity: details?.intensity ?? "moderate",
      notesTop: details?.notes_top ?? [],
      notesHeart: details?.notes_heart ?? [],
      notesBase: details?.notes_base ?? [],
      perfumer: details?.perfumer ?? undefined,
      story: details?.story ?? undefined,
      isLimited: details?.is_limited ?? false,
      sampleEligible: details?.sample_eligible ?? false,
      sampleOfProductId: details?.sample_of_product_id ?? undefined,
    },
  };
}

// Pricing is region-scoped in Medusa's Store API — without region_id (and
// requesting the field explicitly), calculated_price comes back empty.
const regionId = process.env.MEDUSA_INDIA_REGION_ID;
const PRICED_FIELDS = "*variants.calculated_price,+variants.inventory_quantity,+created_at";

// Not a fragrance itself, or a sample rather than a full bottle — excluded
// from general browsing grids (PLP/best-sellers) until the Phase 1 Store
// API extension can filter server-side on perfume_details.sample_eligible.
function isBrowsableFragrance(handle: string | null | undefined) {
  return !!handle && !handle.endsWith("-sample") && handle !== "gift-wrap";
}

async function toPerfumeProducts(rawProducts: RawMedusaProduct[]): Promise<PerfumeProduct[]> {
  const detailsMap = await fetchPerfumeDetailsMap(rawProducts.map((p) => p.id));
  return rawProducts.map((raw) => toPerfumeProduct(raw, detailsMap.get(raw.id)));
}

// "Bestseller" is a merchant-applied tag (Medusa Admin → Products → Tags),
// not a computed sales ranking — there's no real order volume yet to derive
// a genuine bestseller list from. See plan addendum for the merchandising
// rationale on which products carry this tag today.
const BESTSELLER_TAG = "bestseller";

export async function getBestSellers(limit = 4): Promise<PerfumeProduct[]> {
  try {
    const { products } = await medusa.store.product.list({
      limit: 100,
      region_id: regionId,
      fields: PRICED_FIELDS,
    });
    const browsable = products.filter((p) => isBrowsableFragrance(p.handle));
    const converted = await toPerfumeProducts(browsable);
    const bestsellers = converted.filter((product) =>
      product.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG),
    );
    return bestsellers.slice(0, limit);
  } catch {
    // Medusa isn't reachable yet (no Supabase/backend configured) — render
    // the page without this section rather than failing the build.
    return editorialProducts
      .filter((product) => product.tags.some((tag) => tag.toLowerCase() === BESTSELLER_TAG))
      .slice(0, limit);
  }
}

export async function getNewArrivals(limit = 4): Promise<PerfumeProduct[]> {
  try {
    const { products } = await medusa.store.product.list({
      limit: 100,
      region_id: regionId,
      fields: PRICED_FIELDS,
    });
    const browsable = products.filter((p) => isBrowsableFragrance(p.handle));
    const converted = await toPerfumeProducts(browsable);
    return converted
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  } catch {
    return [...editorialProducts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

export interface FamilyShowcaseEntry {
  family: FragranceFamily;
  product: PerfumeProduct;
}

const ALL_FAMILIES: FragranceFamily[] = ["floral", "woody", "oriental", "fresh", "gourmand"];

// One representative product per fragrance family, for the homepage's
// "shop by family" tile grid. Families with no real product yet (e.g.
// "gourmand" as of this catalog) are simply omitted rather than linking to
// an empty collection page.
export async function getFamilyShowcase(): Promise<FamilyShowcaseEntry[]> {
  const { products } = await listProducts({ limit: 100 });
  return ALL_FAMILIES.flatMap((family) => {
    const product = products.find((p) => p.details.family === family);
    return product ? [{ family, product }] : [];
  });
}

export async function getProductByHandle(handle: string): Promise<PerfumeProduct | null> {
  try {
    const { products } = await medusa.store.product.list({
      handle,
      limit: 1,
      region_id: regionId,
      fields: PRICED_FIELDS,
    });
    if (!products[0]) return editorialProducts.find((product) => product.handle === handle) ?? null;
    const detailsMap = await fetchPerfumeDetailsMap([products[0].id]);
    return toPerfumeProduct(products[0], detailsMap.get(products[0].id));
  } catch {
    return editorialProducts.find((product) => product.handle === handle) ?? null;
  }
}

export async function listProducts(params: {
  family?: string;
  gender?: string;
  q?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ products: PerfumeProduct[]; count: number }> {
  try {
    // The family/gender filters live on perfume_details, which Medusa's
    // default product query can't filter on server-side (Phase 1 Store API
    // extension) — fetch the browsable catalog and filter in memory. Fine
    // at this catalog size; revisit if the catalog grows significantly.
    const { products: rawProducts } = await medusa.store.product.list({
      q: params.q,
      limit: 100,
      region_id: regionId,
      fields: PRICED_FIELDS,
    });
    const browsableRaw = rawProducts.filter((p) => isBrowsableFragrance(p.handle));
    if (browsableRaw.length === 0) {
      throw new Error("Use the editorial catalogue while the Medusa catalogue is empty.");
    }
    let products = await toPerfumeProducts(browsableRaw);
    if (params.family) {
      products = products.filter((product) => product.details.family === params.family);
    }
    if (params.gender) {
      products = products.filter((product) => product.details.gender === params.gender);
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
    return { products, count: products.length };
  }
}
