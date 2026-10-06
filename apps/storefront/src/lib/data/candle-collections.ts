// `image` is only a fallback — the tiles show a real candle from that type
// (getCandleShowcaseImages) whenever the catalogue has one.
export const CANDLE_COLLECTIONS = [
  {
    slug: "concrete",
    label: "Concrete Candles",
    image: "/leyros/about-old/scented-candle.webp",
  },
  {
    slug: "soy",
    label: "Soy Wax Candles",
    image: "/leyros/about-old/scented-candle.webp",
  },
  {
    slug: "gel",
    label: "Gel Wax Candles",
    image: "/leyros/atelier.jpg",
  },
] as const;

export type CandleCollectionSlug = (typeof CANDLE_COLLECTIONS)[number]["slug"];

export function isCandleCollectionSlug(value: string): value is CandleCollectionSlug {
  return CANDLE_COLLECTIONS.some((collection) => collection.slug === value);
}
