import type { PerfumeProduct } from "@leyros/types";
import { FAMILY_LABELS } from "@/lib/data/families";
import { genderLabel, productCardTitle } from "@/lib/product-labels";
import { formatSize } from "@/lib/format";

export type ProductSeo = {
  name: string;
  category: string;
  family: string;
  audience: string;
  sizes: string;
  keywords: string[];
  description: string;
};

function unique(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function categoryDetails(product: PerfumeProduct) {
  const category = `${product.category ?? ""} ${product.title}`.toLowerCase();
  if (/attar/.test(category)) {
    return {
      label: "Attar",
      terms: ["Attar", "Pure Oil", "Perfume Oil", "Long-Lasting Attar", "Concentrated Attar", "Alcohol-Free Fragrance", "Indian Attar"],
    };
  }
  if (/car perfume|car fragrance|car freshener/.test(category)) {
    return {
      label: "Car Perfume",
      terms: ["Car Perfume", "Car Fragrance", "Car Freshener", "Long-Lasting Car Perfume", "Premium Car Fragrance"],
    };
  }
  if (/candle/.test(category)) {
    return {
      label: "Scented Candle",
      terms: ["Scented Candle", "Fragrance Candle", "Home Décor Candle", "Aromatherapy Candle", "Candle for Gifting", "Long-Lasting Candle"],
    };
  }
  if (/gift|hamper|coffret/.test(category)) {
    return {
      label: "Fragrance Gift Pack",
      terms: ["Perfume Gift Set", "Fragrance Gift Pack", "Luxury Gift Set", "Perfume Gift for Men and Women", "Leyros Gift Pack"],
    };
  }
  return {
    label: "Perfume",
    terms: ["Perfume", "Eau de Parfum", "Long-Lasting Perfume", "Premium Perfume", "French Perfume Oils", "Perfume for Indian Climate", "Affordable Luxury Fragrance"],
  };
}

export function getProductSeo(product: PerfumeProduct): ProductSeo {
  const name = productCardTitle(product).replace(/\s+\([^)]+\)$/, "");
  const { label: category, terms } = categoryDetails(product);
  const isWearable = category === "Perfume" || category === "Attar";
  const family = isWearable ? FAMILY_LABELS[product.details.family] : "";
  const gender = isWearable ? genderLabel(product) ?? "Unisex" : "";
  const audience = gender ? `${gender} ${category}` : category;
  const sizes = product.variants.map((variant) => formatSize(variant.sizeMl, variant.sizeLabel)).join(" · ");
  const notes = unique([...product.details.notesTop, ...product.details.notesHeart, ...product.details.notesBase]).slice(0, 6);
  const keywords = unique([
    name,
    `Leyros ${name}`,
    product.category,
    audience,
    family && `${family} ${category}`,
    ...terms,
    ...notes,
    ...product.tags,
    ...product.variants.map((variant) => `${name} ${formatSize(variant.sizeMl, variant.sizeLabel)}`),
  ]).slice(0, 24);
  const sourceDescription = product.description.replace(/\s+/g, " ").trim();
  const description = sourceDescription.length > 155
    ? `${sourceDescription.slice(0, 155).replace(/\s+\S*$/, "")}…`
    : sourceDescription;

  return { name, category, family, audience, sizes, keywords, description };
}
