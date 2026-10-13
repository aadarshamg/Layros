// Curated category photography for the homepage candle collection cards.
export const CANDLE_COLLECTIONS = [
  {
    slug: "concrete",
    label: "Concrete Candles",
    image: "/leyros/candle-collections/concrete.jpg",
  },
  {
    slug: "soy",
    label: "Soy Wax Candles",
    image: "/leyros/candle-collections/soy.jpg",
  },
  {
    slug: "gel",
    label: "Gel Wax Candles",
    image: "/leyros/candle-collections/gel.jpg",
  },
] as const;

export type CandleCollectionSlug = (typeof CANDLE_COLLECTIONS)[number]["slug"];

export function isCandleCollectionSlug(value: string): value is CandleCollectionSlug {
  return CANDLE_COLLECTIONS.some((collection) => collection.slug === value);
}
