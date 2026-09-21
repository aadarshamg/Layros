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
  sku: string;
  price: number;
  inventoryQuantity: number;
}

export interface PerfumeProduct {
  id: string;
  handle: string;
  title: string;
  brand: string;
  description: string;
  images: string[];
  variants: PerfumeVariant[];
  tags: string[];
  details: PerfumeDetails;
  createdAt: string;
}

export interface GiftWrapSelection {
  enabled: boolean;
  message?: string;
  forLineItemId?: string;
}

export interface CheckoutDetailsFormData {
  email: string;
  phone?: string;
  createAccount: boolean;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: "IN";
  };
  shippingMethodId: string;
  giftWrap?: GiftWrapSelection;
  newsletterOptIn: boolean;
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
