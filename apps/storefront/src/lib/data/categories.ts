// Real category filter chips for the collection/browse page — these are the
// actual merchandising divisions from the migrated catalog (see
// apps/sanity-studio/scripts/migrate-live-catalog.mjs), not an invented
// taxonomy. Matches product.category via a case-insensitive keyword
// (listProducts' `category` filter), so a short/clean chip label is enough,
// it doesn't need to equal the full stored string.
export const CATEGORY_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All products", value: "" },
  // Real perfume categories are named "The X Collections / Beauty and
  // Personal Care" (fresh, ambry, floral, woody, oud, gourmand) — none of
  // them contain the word "perfume", so a "perfume" keyword matched almost
  // nothing real. "collections" is the substring they all actually share.
  { label: "Perfumes", value: "collections" },
  { label: "Attars", value: "attar" },
  { label: "Car Perfumes", value: "car perfume" },
  { label: "Candles", value: "candle" },
  { label: "Gift Packs", value: "gift pack" },
];
