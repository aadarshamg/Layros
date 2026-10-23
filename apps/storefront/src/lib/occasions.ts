import type { PerfumeProduct } from "@leyros/types";

/**
 * Occasion filters (H9), read from each product's highlights in admin
 * (Daily Wear, Office Wear, Date Night, Special Occasion, Summer Fresh,
 * Winter Warmth, Gym & Sports). The collection page filters by `?wear=`.
 */
export const OCCASIONS = [
  { value: "office", label: "Office", matches: /office/i },
  { value: "date-night", label: "Date Night", matches: /date night/i },
  { value: "gym", label: "Gym", matches: /gym|sport/i },
  { value: "wedding", label: "Wedding", matches: /special occasion|wedding|party/i },
  { value: "summer", label: "Summer", matches: /summer/i },
  { value: "winter", label: "Winter", matches: /winter/i },
  { value: "daily", label: "Daily Wear", matches: /daily/i },
] as const;

export type OccasionValue = (typeof OCCASIONS)[number]["value"];

export const findOccasion = (value: string | undefined) => OCCASIONS.find((occasion) => occasion.value === value);

export function suitsOccasion(product: PerfumeProduct, value: string) {
  const occasion = findOccasion(value);
  return Boolean(occasion && (product.highlights ?? []).some((highlight) => occasion.matches.test(highlight.title)));
}
