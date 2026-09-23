// One-off migration: seeds the real editorial perfume catalogue (previously
// only a static fallback file in the storefront) into Sanity as actual
// `product` documents, uploading each referenced image as a real asset.
//
// Safe to re-run: each document uses a deterministic _id (`product-<handle>`)
// and is created with createOrReplace, so running this twice just re-syncs
// the same six products rather than duplicating them.
//
// Usage (from apps/sanity-studio):
//   node --env-file=.env scripts/migrate-products.mjs
//
// Requires SANITY_API_TOKEN in apps/sanity-studio/.env — create one at
// https://www.sanity.io/manage → your project → API → Tokens → Add API token
// (needs "Editor" permission, since this writes documents and uploads assets).

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, "../../storefront/public");

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error("Missing SANITY_STUDIO_PROJECT_ID (check apps/sanity-studio/.env).");
  process.exit(1);
}
if (!token) {
  console.error(
    "Missing SANITY_API_TOKEN. Create a write token at https://www.sanity.io/manage " +
      "(project → API → Tokens → Add API token, 'Editor' permission), then add it to " +
      "apps/sanity-studio/.env as SANITY_API_TOKEN=... and re-run.",
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false });

// Mirrors apps/storefront/src/lib/data/editorial-products.ts — kept as plain
// data here (rather than imported) since this script isn't part of the
// storefront's TypeScript build.
const products = [
  {
    handle: "nuit-doree",
    title: "Nuit Dorée",
    description:
      "A nocturnal ode to liquid gold, blending rare Kashmiri saffron, aged Mysore sandalwood, velvety Kannauj damask rose, and wild Assam ambergris.",
    images: ["/leyros/nuit-doree-hero.jpg", "/leyros/nuit-detail.jpg", "/leyros/cap-detail.jpg"],
    variants: [
      { sizeMl: 50, sku: "LEY-ND-050", price: 4800, inventoryQuantity: 12 },
      { sizeMl: 100, sku: "LEY-ND-100", price: 7200, inventoryQuantity: 8 },
    ],
    tags: ["Collector's Edition", "Bestseller"],
    details: {
      concentration: "PARFUM",
      family: "oriental",
      gender: "unisex",
      intensity: "strong",
      notesTop: ["Atlas saffron", "Calabrian bergamot", "Pink peppercorn"],
      notesHeart: ["Kannauj rose", "Papyrus smoke", "Moroccan cedar"],
      notesBase: ["Mysore sandalwood", "Oud", "Golden benzoin"],
      perfumer: "Henri de Valois",
      story:
        "Composed as twilight in a flacon: luminous saffron gives way to rose and papyrus before settling into an intimate trail of sandalwood, oud, and warm resin.",
      isLimited: true,
      sampleEligible: false,
    },
  },
  {
    handle: "santal-celeste",
    title: "Santal Céleste",
    description: "Aged Mysore sandalwood oil married with milky rice accord, white cedar, and iris butter.",
    images: ["/leyros/santal-celeste.jpg"],
    variants: [{ sizeMl: 100, sku: "LEY-SC-100", price: 5000, inventoryQuantity: 14 }],
    tags: ["Rare Harvest", "Bestseller"],
    details: {
      concentration: "PARFUM",
      family: "woody",
      gender: "unisex",
      intensity: "moderate",
      notesTop: ["Cardamom", "Bergamot"],
      notesHeart: ["Milky rice", "Iris butter"],
      notesBase: ["Mysore sandalwood", "White cedar"],
      isLimited: false,
      sampleEligible: false,
    },
  },
  {
    handle: "iris-imperial",
    title: "Iris Impérial",
    description: "Aged Florentine orris in Kannauj cedar, wrapped in violet leaf and mineral musk.",
    images: ["/leyros/iris-imperial.jpg"],
    variants: [{ sizeMl: 100, sku: "LEY-II-100", price: 4600, inventoryQuantity: 9 }],
    tags: ["Extrait de Parfum"],
    details: {
      concentration: "PARFUM",
      family: "floral",
      gender: "unisex",
      intensity: "moderate",
      notesTop: ["Violet leaf", "Pink pepper"],
      notesHeart: ["Florentine orris", "Mimosa"],
      notesBase: ["Kannauj cedar", "Mineral musk"],
      isLimited: false,
      sampleEligible: false,
    },
  },
  {
    handle: "fleur-doranger-sauvage",
    title: "Fleur d'Oranger Sauvage",
    description: "Luminescent Coorg orange blossom and neroli softened by green cardamom and white tea.",
    images: ["/leyros/fleur-oranger.jpg"],
    variants: [{ sizeMl: 100, sku: "LEY-FO-100", price: 3900, inventoryQuantity: 18 }],
    tags: ["Extrait de Parfum"],
    details: {
      concentration: "PARFUM",
      family: "fresh",
      gender: "unisex",
      intensity: "light",
      notesTop: ["Green cardamom", "White tea"],
      notesHeart: ["Orange blossom", "Neroli"],
      notesBase: ["White musk", "Vetiver"],
      isLimited: false,
      sampleEligible: false,
    },
  },
  {
    handle: "vetiver-de-malabar",
    title: "Vétiver de Malabar",
    description: "South Indian wild khus root over smoky Himalayan birch, lifted by bitter pink grapefruit.",
    images: ["/leyros/vetiver-malabar.jpg"],
    variants: [{ sizeMl: 100, sku: "LEY-VM-100", price: 4200, inventoryQuantity: 11 }],
    tags: ["Limited Harvest"],
    details: {
      concentration: "PARFUM",
      family: "woody",
      gender: "unisex",
      intensity: "strong",
      notesTop: ["Pink grapefruit", "Black pepper"],
      notesHeart: ["South Indian khus", "Cedar"],
      notesBase: ["Himalayan birch", "Oakmoss"],
      isLimited: true,
      sampleEligible: false,
    },
  },
  {
    handle: "cuir-mystique",
    title: "Cuir Mystique",
    description: "Royal Indian saddle leather warmed with temple frankincense, amber tears, and styrax balm.",
    images: ["/leyros/cuir-mystique.jpg"],
    variants: [{ sizeMl: 100, sku: "LEY-CM-100", price: 5200, inventoryQuantity: 7 }],
    tags: ["Bespoke Accord", "Bestseller"],
    details: {
      concentration: "PARFUM",
      family: "oriental",
      gender: "unisex",
      intensity: "strong",
      notesTop: ["Saffron", "Elemi"],
      notesHeart: ["Royal leather", "Frankincense"],
      notesBase: ["Amber", "Styrax balm"],
      isLimited: false,
      sampleEligible: false,
    },
  },
];

async function uploadImage(publicPath) {
  const absolutePath = resolve(PUBLIC_DIR, publicPath.replace(/^\//, ""));
  const buffer = readFileSync(absolutePath);
  const filename = publicPath.split("/").pop();
  const asset = await client.assets.upload("image", buffer, { filename });
  return { _type: "image", _key: asset._id, asset: { _type: "reference", _ref: asset._id } };
}

async function migrateProduct(product) {
  console.log(`Uploading images for "${product.title}"...`);
  const images = [];
  for (const path of product.images) {
    images.push(await uploadImage(path));
  }

  const doc = {
    _id: `product-${product.handle}`,
    _type: "product",
    title: product.title,
    slug: { _type: "slug", current: product.handle },
    brand: "Leyros",
    description: product.description,
    images,
    tags: product.tags,
    variants: product.variants.map((v, i) => ({
      _type: "variant",
      _key: `${product.handle}-variant-${i}`,
      ...v,
    })),
    details: product.details,
  };

  await client.createOrReplace(doc);
  console.log(`  → saved as ${doc._id}`);
}

for (const product of products) {
  await migrateProduct(product);
}

console.log(`\nDone. Migrated ${products.length} products into Sanity dataset "${dataset}".`);
