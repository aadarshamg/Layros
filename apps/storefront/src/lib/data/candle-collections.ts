// Coordinated generated category imagery, shared by homepage and candle landing page.
export const CANDLE_COLLECTIONS = [
  {
    slug: "concrete",
    label: "Concrete Candles",
    image: "/leyros/candle-collections/concrete-v2.webp",
  },
  {
    slug: "soy",
    label: "Soy Wax Candles",
    image: "/leyros/candle-collections/soy-v2.webp",
  },
  {
    slug: "gel",
    label: "Gel Wax Candles",
    image: "/leyros/candle-collections/gel-v2.webp",
  },
] as const;

export type CandleCollectionSlug = (typeof CANDLE_COLLECTIONS)[number]["slug"];

export function isCandleCollectionSlug(value: string): value is CandleCollectionSlug {
  return CANDLE_COLLECTIONS.some((collection) => collection.slug === value);
}
