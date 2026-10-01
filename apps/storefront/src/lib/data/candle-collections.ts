export const CANDLE_COLLECTIONS = [
  {
    slug: "concrete",
    label: "Concrete Candles",
    description: "Sculptural statement pieces that bring fragrance, warmth, and modern form into your space.",
    headline: "Sculptural fragrance that looks as considered as it smells.",
    uses: "Console styling, living-room décor, housewarmings, intimate dinners, and statement gifting.",
    features: ["Scent meets sculpture", "Décor-ready forms", "Memorable gifting"],
    image: "/leyros/about-old/scented-candle.webp",
  },
  {
    slug: "soy",
    label: "Soy Wax Candles",
    description: "Comforting home fragrances created for an even, atmospheric burn and everyday rituals.",
    headline: "Comforting fragrance and warm ambience for everyday rituals.",
    uses: "Bedrooms, reading corners, relaxation, self-care evenings, celebrations, and thoughtful gifts.",
    features: ["Soft, inviting ambience", "Everyday fragrance ritual", "Elegant home styling"],
    image: "/leyros/candle.jpg",
  },
  {
    slug: "gel",
    label: "Gel Wax Candles",
    description: "Decorative glass candles with a luminous finish, designed to make gifting and hosting feel special.",
    headline: "Luminous candlelight with a decorative, glass-led finish.",
    uses: "Festive tables, celebrations, romantic settings, display shelves, hosting, and premium gifting.",
    features: ["Luminous presentation", "Decorative glass appeal", "Celebration-ready"],
    image: "/leyros/atelier.jpg",
  },
] as const;

export type CandleCollectionSlug = (typeof CANDLE_COLLECTIONS)[number]["slug"];

export function isCandleCollectionSlug(value: string): value is CandleCollectionSlug {
  return CANDLE_COLLECTIONS.some((collection) => collection.slug === value);
}
