export type Concentration = "EDT" | "EDP" | "PARFUM";
export type Gender = "feminine" | "masculine" | "unisex";
export type FragranceFamily = "floral" | "woody" | "oriental" | "fresh" | "gourmand";
export type Intensity = "light" | "moderate" | "strong";

export interface PerfumeDetails {
  concentration: Concentration;
  family: FragranceFamily;
  gender: Gender;
  intensity: Intensity;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  perfumer?: string;
  story?: string;
  isLimited: boolean;
  sampleEligible: boolean;
  sampleOfProductId?: string;
}

export interface PerfumeVariant {
  id: string;
  sizeMl: 30 | 50 | 100;
  /**
   * Free-text size/quantity label, e.g. "100ml", "645g", "10ml x 5" —
   * displayed instead of `sizeMl`+"ml" whenever present, since the catalog
   * covers candles, gift sets, and other non-ml products, not just perfume
   * bottles. Falls back to `${sizeMl}ml` when absent (older perfume-only
   * entries created before this field existed).
   */
  sizeLabel?: string;
  sku: string;
  price: number;
  /** Struck-through "original" price shown alongside `price` when the variant is on sale. */
  compareAtPrice?: number;
  inventoryQuantity: number;
}

export interface ShoppableVideo {
  id: string;
  videoUrl: string;
  creatorHandle?: string;
  creatorAvatar?: string;
  promoBadge?: string;
  order: number;
  product: PerfumeProduct;
}

export interface PerfumeProduct {
  id: string;
  handle: string;
  title: string;
  brand: string;
  description: string;
  images: string[];
  /** Optional fragrance-film/demo video for this specific product — absent until one is added in Sanity. */
  videoUrl?: string;
  variants: PerfumeVariant[];
  tags: string[];
  /**
   * Perfume-specific attributes (notes, concentration, etc.). Populated with
   * neutral defaults for non-perfume catalog items (candles, car
   * fresheners) so existing perfume-oriented UI doesn't break — a real,
   * separate UI treatment for those categories is follow-up work.
   */
  details: PerfumeDetails;
  /** Real merchandising category, e.g. "Men Perfumes", "Fragrance Candles", "Car Perfumes". */
  category?: string;
  createdAt: string;
}

export interface GiftWrapSelection {
  enabled: boolean;
  message?: string;
  forLineItemId?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: "IN";
}

export interface CheckoutDetailsFormData {
  email: string;
  phone?: string;
  createAccount: boolean;
  shippingAddress: ShippingAddress;
  shippingMethodId: string;
  giftWrap?: GiftWrapSelection;
  newsletterOptIn: boolean;
}

/**
 * A logged-in customer's profile. Identity is the phone number itself (no
 * password — see lib/auth/* in the storefront) — `id` is the Sanity
 * document id, deterministically `customer-<10-digit phone>`.
 */
export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  defaultShippingAddress?: ShippingAddress;
  marketingOptIn: boolean;
}

export interface CheckoutPaymentFormData {
  billingSameAsShipping: boolean;
  billingAddress?: CheckoutDetailsFormData["shippingAddress"];
  paymentProviderId: string;
  promoCode?: string;
  acceptedTerms: boolean;
}

export interface SanitySeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface SanityPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  mainImage?: string;
  authorName?: string;
  categories?: string[];
  seo?: SanitySeo;
}
