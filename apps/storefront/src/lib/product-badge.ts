import type { PerfumeProduct } from "@leyros/types";
import { availableQuantity, isStockTracked } from "@/lib/stock";

export type ProductBadge = {
  label: string;
  tone: "best" | "hot" | "fast" | "stock" | "default";
};

function stableIndex(value: string, length: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % length;
}

function displayTag(tag: string) {
  return tag
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Keeps urgency claims tied to real stock. Products explicitly merchandised
 * as bestsellers receive deterministic label variety instead of every card
 * repeating the same badge.
 */
export function getProductBadge(product: PerfumeProduct): ProductBadge | null {
  // Only when every size is tracked: an untracked size has no known count,
  // so a low total would wrongly claim scarcity.
  const allTracked = product.variants.length > 0 && product.variants.every(isStockTracked);
  const availableUnits = allTracked
    ? product.variants.reduce((total, variant) => total + (availableQuantity(variant) ?? 0), 0)
    : 0;

  if (availableUnits > 0 && availableUnits <= 5) {
    return { label: `Only ${availableUnits} Left`, tone: "stock" };
  }
  if (availableUnits > 5 && availableUnits <= 10) {
    return { label: "Limited Stock", tone: "stock" };
  }

  const tags = product.tags.map((tag) => tag.trim()).filter(Boolean);
  const normalizedTags = tags.map((tag) => tag.toLowerCase().replace(/[-_]+/g, " "));
  const explicitIndex = normalizedTags.findIndex((tag) => ["hot selling", "selling fast", "limited stock"].includes(tag));
  if (explicitIndex >= 0) {
    const label = normalizedTags[explicitIndex] === "hot selling"
      ? "Hot Selling"
      : normalizedTags[explicitIndex] === "selling fast"
        ? "Selling Fast"
        : "Limited Stock";
    return { label, tone: label === "Hot Selling" ? "hot" : label === "Selling Fast" ? "fast" : "stock" };
  }

  if (normalizedTags.some((tag) => tag === "bestseller" || tag === "best seller")) {
    const labels: ProductBadge[] = [
      { label: "Best Seller", tone: "best" },
      { label: "Hot Selling", tone: "hot" },
      { label: "Selling Fast", tone: "fast" },
    ];
    return labels[stableIndex(product.id || product.handle, labels.length)];
  }

  return tags[0] ? { label: displayTag(tags[0]), tone: "default" } : null;
}
