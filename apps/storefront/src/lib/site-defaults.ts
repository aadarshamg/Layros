/**
 * Fallbacks used only until an admin fills in the real values in Sanity
 * (Store Settings) — kept in one place so, unlike before, a missing config
 * value can never silently drift out of sync across multiple pages again.
 */
export const DEFAULT_CONTACT_EMAIL = "support@leyros.in";
// Confirmed via the real WhatsApp link (wa.me/919915083150) — the "82150"
// that had spread across most pages before this file existed was the wrong
// one; this is the one real number.
export const DEFAULT_CONTACT_PHONE = "+91 99150 83150";
export const DEFAULT_WHATSAPP_NUMBER = "919915083150";
export const DEFAULT_WHATSAPP_SUGGESTED_MESSAGE = "Which fragrance is best for me?";
export const DEFAULT_TAGLINE = "L’Art du Flacon · Édition 2026";
export const DEFAULT_HERO_VIDEO_URL = "/leyros/perfume-aroma-hero.mp4";
export const DEFAULT_HERO_POSTER_URL = "/leyros/nuit-doree-hero.jpg";
// For now the homepage opens on this static campaign banner and the hero
// video is switched off. Set to null to bring the video hero back.
export const HERO_BANNER: { src: string; width: number; height: number; alt: string; href: string } | null = {
  src: "/leyros/hero-banner.jpg",
  width: 1672,
  height: 941,
  alt: "Leyros, Luxury Fragrance House: Scents. Style. Statement. Aventra, Aqualis and Veloria eau de parfum beside a Leyros gift box.",
  href: "/collections/all?category=collections",
};
export const DEFAULT_BRAND_ADDRESS = "Ludhiana, Punjab, 141116";
export const DEFAULT_ANNOUNCEMENT_MESSAGES = [
  "Free discovery sample on orders over ₹3,500",
  "Freshly blended in small batches",
  "Free shipping across India on orders over ₹999",
];
export const DEFAULT_TRUST_BADGE_TEXT = "Loved by over 10,000+ Customers";
export const DEFAULT_TRIAL_SECTION_TITLE = "The Discovery Edit";
// Match the site's existing copy: "Dispatches within 24–48 hours" and
// "Standard delivery arrives in 3–5 business days".
export const DEFAULT_DISPATCH_DAYS = 2;
export const DEFAULT_DELIVERY_DAYS_MIN = 3;
export const DEFAULT_DELIVERY_DAYS_MAX = 5;
