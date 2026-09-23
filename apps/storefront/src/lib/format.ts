export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Prefers a variant's free-text size label ("645g Thali", "10ml x 5") when
 * set — the catalog spans candles and gift sets, not just ml-based perfume
 * bottles — and falls back to "Xml" for plain perfume variants that don't
 * set one.
 */
export function formatSize(sizeMl: number, sizeLabel?: string) {
  return sizeLabel?.trim() || `${sizeMl}ml`;
}
