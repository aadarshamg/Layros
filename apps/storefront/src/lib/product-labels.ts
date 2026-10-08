import type { PerfumeProduct } from "@leyros/types";

const NON_PERFUME_CATEGORY = /^(Fragrance Candles|Car Perfumes|Festival Gift Packs)/i;

/** "Men" / "Women" / "Unisex" for wearable fragrances; null for candles, car fresheners and hampers. */
export function genderLabel(product: PerfumeProduct): string | null {
  if (NON_PERFUME_CATEGORY.test(product.category ?? "")) return null;
  if (product.details.gender === "masculine") return "Men";
  if (product.details.gender === "feminine") return "Women";
  return "Unisex";
}

export function productCardCategoryLabel(product: PerfumeProduct): string {
  const gender = genderLabel(product);
  if (gender) return gender;

  const category = product.category ?? "";
  if (/car perfume/i.test(category)) return "Car Perfume";
  if (/candle/i.test(category)) return "Candle";
  if (/gift|hamper/i.test(category)) return "Gift Pack";
  if (/attar/i.test(category)) return "Attar";
  return "Leyros";
}

/** Compact merchandising name for product cards; the source title remains untouched. */
export function productCardTitle(product: PerfumeProduct): string {
  // Perfumes show Men / Women / Unisex as a badge on the photo, so the name
  // stands alone; other products keep their type, e.g. "… (CANDLE)".
  if (genderLabel(product)) return productCardName(product);
  return `${productCardName(product)} (${productCardCategoryLabel(product).toLocaleUpperCase("en-IN")})`;
}

/** Just the fragrance's name, e.g. "OMBRÉE LEATHER" — no size, gender, or "Inspired by…" tail. */
export function productCardName(product: PerfumeProduct): string {
  let name = product.title
    .split("|")[0]
    .split(/\s+[–—-]\s+/)[0]
    .replace(/\([^)]*(?:ml|gm|grams?|set of)[^)]*\)/gi, "")
    .replace(/["“”']?(?:men(?:'s)?|women(?:'s)?|unisex)["“”']?\s+(?=(?:perfume|fragrance|inspired)\b)/gi, "")
    .replace(/\b(?:eau de parfum|eau de toilette|perfume|fragrance|parfum|edp|inspired)\b.*$/i, "")
    // Gender is the photo badge's job, and size is picked below the name.
    .replace(/["“”']?\b(?:men|women|unisex)\b["“”']?/gi, "")
    .replace(/\b\d+\s?ml\b/gi, "")
    // "YSL-Y Men & Women" loses both gender words; drop the "&" left behind.
    .replace(/\s+(?:&|and)\s*(?=$|\s(?:&|and)\b)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(?:luxury|premium)$/i, "");

  if (!name) name = product.brand || "Leyros";
  return name.toLocaleUpperCase("en-IN");
}

// Accord words as written in the product's own title (then description),
// e.g. "Ambery Sweet Perfume" -> Amber, Sweet. Order follows the text.
const ACCORDS: [RegExp, string][] = [
  [/\btobacco\b/i, "Tobacco"],
  [/\bvanilla\b/i, "Vanilla"],
  [/\bamb(?:er|ery|ry)\b/i, "Amber"],
  [/\bsweet\b/i, "Sweet"],
  [/\bspic(?:y|e)\b/i, "Spicy"],
  [/\bwood(?:y|s)?\b/i, "Woody"],
  [/\bfresh\b/i, "Fresh"],
  [/\bcitrus\b/i, "Citrus"],
  [/\b(?:aquatic|marine)\b/i, "Aquatic"],
  [/\bfloral\b/i, "Floral"],
  [/\bfruity\b/i, "Fruity"],
  [/\boud\b/i, "Oud"],
  [/\bleather\b/i, "Leather"],
  [/\bmusk(?:y)?\b/i, "Musk"],
  [/\baromatic\b/i, "Aromatic"],
  [/\bsmoky\b/i, "Smoky"],
  [/\bgourmand\b/i, "Gourmand"],
  [/\bpowdery\b/i, "Powdery"],
  [/\bearthy\b/i, "Earthy"],
  [/\boriental\b/i, "Oriental"],
];

function accordsIn(text: string): string[] {
  return ACCORDS
    .map(([pattern, label]) => ({ label, at: text.search(pattern) }))
    .filter((hit) => hit.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((hit) => hit.label);
}

// Not notes: descriptive filler some descriptions use ("A zesty ...", "Deep").
const NOT_A_NOTE = /^(?:an?|the)\s|^(?:deep|warm|clean|fresh|rich|soft|earthy|spicy|zesty|vibrant|elegant|sweet|woody)$/i;

// First note of each layer from a description's "Top Notes: …, Heart: …,
// Base: …" list, e.g. Aqualis -> Sea Water, Sandalwood, Musk.
function pyramidFromDescription(description: string): string[] {
  const text = description.replace(/[​ ]/g, " ");
  const firstNote = (layer: RegExp) => {
    const match = text.match(layer);
    if (!match) return null;
    return match[1]
      .split(/,|\band\b|&|\//i)
      .map((part) => part
        .replace(/[.:;|]+$/, "")
        // "Spicy opening of Saffron" -> "Saffron"
        .replace(/^.*\bof\s+/i, "")
        .replace(/^(?:rich|premium|refreshing|ripe)\s+/i, "")
        .replace(/\s+(?:notes?|accords?)$/i, "")
        .trim())
      .find((part) => part && part.length < 30 && !NOT_A_NOTE.test(part)) ?? null;
  };
  return [
    firstNote(/top(?:\s*notes?)?\s*[:\-–]\s*([^\n.]+)/i),
    firstNote(/(?:heart|middle)(?:\s*notes?)?\s*[:\-–]\s*([^\n.]+)/i),
    firstNote(/base(?:\s*notes?)?\s*[:\-–]\s*([^\n.]+)/i),
  ].filter((note): note is string => Boolean(note));
}

/**
 * Card scent line, e.g. "Sea Water • Sandalwood • Musk (Daily Wear)": the
 * notes entered in admin when there are any, else one note per layer from the
 * description's notes list, else the accords named in the title, plus the
 * first "when to wear" highlight.
 */
export function productScentLine(product: PerfumeProduct): string {
  const notes = [...product.details.notesTop, ...product.details.notesHeart, ...product.details.notesBase]
    .filter((note, index, all) => note && all.indexOf(note) === index);
  const pyramid = [...new Set(pyramidFromDescription(product.description ?? ""))];
  const fromText = [...new Set([...accordsIn(product.title), ...accordsIn(product.description ?? "")])];
  const source = notes.length ? notes : pyramid.length >= 2 ? pyramid : fromText;
  const scent = source.slice(0, 3).join(" • ");
  const occasion = product.highlights?.[0]?.title;
  if (scent && occasion) return `${scent} (${occasion})`;
  return scent || occasion || "";
}
