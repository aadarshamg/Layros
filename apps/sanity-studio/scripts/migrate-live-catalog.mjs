// Migrates the REAL catalog from the old live site (leyrosperfume.com) into
// Sanity, replacing the placeholder demo products. That site is a Next.js
// app that server-renders each product page's full data into a
// __NEXT_DATA__ script tag, so this reads that directly rather than needing
// a headless browser or reverse-engineered API calls.
//
// Safe to re-run: every document uses a deterministic _id derived from the
// old site's variantFamilyId, so re-running just re-syncs the same products
// rather than duplicating them.
//
// Usage (from apps/sanity-studio):
//   node --env-file=.env scripts/migrate-live-catalog.mjs
//
// Requires SANITY_API_TOKEN in apps/sanity-studio/.env (same token used by
// migrate-products.mjs).

import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error("Missing SANITY_STUDIO_PROJECT_ID or SANITY_API_TOKEN — check apps/sanity-studio/.env.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false });

const SITE_BASE = "https://www.leyrosperfume.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_IMAGES_PER_PRODUCT = 6;
const REQUEST_DELAY_MS = 250; // be polite to the old site — it's still live/serving real customers

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSitemapProductIds() {
  const res = await fetch(`${SITE_BASE}/sitemap.xml`, { headers: { "User-Agent": USER_AGENT } });
  const xml = await res.text();
  const ids = [...xml.matchAll(/\/product\/([a-f0-9-]{36})/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

async function fetchProductPageProps(id) {
  const res = await fetch(`${SITE_BASE}/product/${id}`, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]).props.pageProps;
  } catch {
    return null;
  }
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<\/(p|li|div|br)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(text, fallbackSuffix) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return `${base || "product"}-${fallbackSuffix.slice(0, 8)}`;
}

function parseSizeMl(label) {
  if (!label) return 0;
  const match = String(label).match(/(\d+)\s*ml/i);
  return match ? Number(match[1]) : 0;
}

function isLikelyPerfume(categoryName, division, title) {
  const text = `${categoryName ?? ""} ${division ?? ""} ${title ?? ""}`.toLowerCase();
  if (text.includes("candle")) return false;
  return /perfume|attar|eau de|fragrance oil|edp|edt/.test(text);
}

const uploadedAssetByUrl = new Map();

async function uploadImage(url) {
  if (uploadedAssetByUrl.has(url)) return uploadedAssetByUrl.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = url.split("/").pop()?.split("?")[0] || "image.jpg";
  const asset = await client.assets.upload("image", buffer, { filename });
  const ref = { _type: "image", _key: asset._id, asset: { _type: "reference", _ref: asset._id } };
  uploadedAssetByUrl.set(url, ref);
  return ref;
}

async function migrateProduct(pageProps, sourceId) {
  const catalog = pageProps.catalog;
  const familyId = catalog.variantFamilyId || catalog.primaryProductId || sourceId;
  const variantsInfo = catalog.variantsInfo || [];
  if (variantsInfo.length === 0) return { status: "skipped", reason: "no variants" };

  const first = variantsInfo[0];
  const title = first.attributes.name?.trim();
  if (!title) return { status: "skipped", reason: "no title" };

  const category = catalog.businessCategory || {};
  const imageUrls = [
    first.attributes.imageInfo?.primaryUrl,
    ...(first.attributes.imageInfo?.secondaryUrls || []),
  ]
    .filter(Boolean)
    .slice(0, MAX_IMAGES_PER_PRODUCT);

  const images = [];
  for (const url of imageUrls) {
    try {
      images.push(await uploadImage(url));
    } catch (err) {
      console.warn(`  image upload failed (${url}):`, err.message);
    }
  }

  const variants = variantsInfo.map((v, index) => {
    const sizeLabel = v.variantDimensions?.size?.value || null;
    return {
      _type: "variant",
      _key: `${familyId}-v${index}`,
      sizeMl: parseSizeMl(sizeLabel) || 50,
      sizeLabel: sizeLabel || undefined,
      sku: v.sku,
      price: v.attributes.price?.discountedPrice ?? 0,
      compareAtPrice: v.attributes.price?.mrp ?? undefined,
      inventoryQuantity: v.attributes.quantity ?? 0,
    };
  });

  const tags = [];
  if (first.attributes.bestSeller) tags.push("Bestseller");

  const perfume = isLikelyPerfume(category.name, category.division, title);

  const doc = {
    _id: `live-product-${familyId}`,
    _type: "product",
    title,
    slug: { _type: "slug", current: slugify(title, familyId) },
    brand: "Leyros",
    description: stripHtml(first.attributes.description),
    category: [category.division, category.name].filter(Boolean).join(" / ") || undefined,
    images,
    tags,
    variants,
    details: {
      concentration: "EDP",
      family: "fresh",
      gender: "unisex",
      intensity: "moderate",
      notesTop: [],
      notesHeart: [],
      notesBase: [],
      isLimited: false,
      sampleEligible: false,
    },
  };
  void perfume; // classification kept for future use (dedicated non-perfume UI); not yet consumed

  await client.createOrReplace(doc);
  return { status: "migrated", title };
}

async function main() {
  const ids = await fetchSitemapProductIds();
  console.log(`Found ${ids.length} product URLs in the old site's sitemap.\n`);

  const seenFamilies = new Set();
  let migrated = 0;
  let skippedDuplicate = 0;
  let skippedOther = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    process.stdout.write(`[${i + 1}/${ids.length}] `);
    try {
      const pageProps = await fetchProductPageProps(id);
      if (!pageProps?.catalog) {
        console.log(`skip (no catalog data) — ${id}`);
        skippedOther++;
        await sleep(REQUEST_DELAY_MS);
        continue;
      }
      const familyId = pageProps.catalog.variantFamilyId || pageProps.catalog.primaryProductId || id;
      if (seenFamilies.has(familyId)) {
        console.log(`skip (already migrated this product's other size) — ${id}`);
        skippedDuplicate++;
        await sleep(REQUEST_DELAY_MS);
        continue;
      }
      seenFamilies.add(familyId);

      const result = await migrateProduct(pageProps, id);
      if (result.status === "migrated") {
        console.log(`OK — ${result.title}`);
        migrated++;
      } else {
        console.log(`skip (${result.reason}) — ${id}`);
        skippedOther++;
      }
    } catch (err) {
      console.log(`FAILED — ${id}: ${err.message}`);
      failed++;
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(
    `\nDone. Migrated ${migrated} products, skipped ${skippedDuplicate} duplicate size-variants, skipped ${skippedOther} other, ${failed} failed.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
