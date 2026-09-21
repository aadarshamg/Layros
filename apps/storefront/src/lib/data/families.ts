import type { FragranceFamily } from "@leyros/types";

// Single source of truth for family display copy, so the PLP filter chips
// and the homepage's "shop by family" tiles never drift out of sync.
export const FAMILY_LABELS: Record<FragranceFamily, string> = {
  floral: "Floral",
  woody: "Woody",
  oriental: "Amber & Oriental",
  fresh: "Fresh",
  gourmand: "Gourmand",
};

export const FAMILY_FILTER_OPTIONS: { label: string; value: FragranceFamily | "" }[] = [
  { label: "All creations", value: "" },
  { label: FAMILY_LABELS.woody, value: "woody" },
  { label: FAMILY_LABELS.floral, value: "floral" },
  { label: FAMILY_LABELS.oriental, value: "oriental" },
  { label: FAMILY_LABELS.fresh, value: "fresh" },
];
