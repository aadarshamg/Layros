import "server-only";
import { sanityClient, sanityConfigured, urlForImage, SANITY_FETCH_OPTIONS } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";

export interface StoreSettings {
  announcementMessages?: string[];
  tagline?: string;
  heroVideoUrl?: string;
  heroPosterUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  brandAddress?: string;
  whatsappNumber?: string;
  whatsappSuggestedMessage?: string;
  googleRating?: number;
  googleReviewCount?: number;
  googleReviewsUrl?: string;
  cartPromoBanner?: string;
  trustBadgeText?: string;
  rewardEnabled: boolean;
  rewardThreshold?: number;
  rewardDescription?: string;
}

interface RawStoreSettings {
  announcementMessages?: string[] | null;
  tagline?: string | null;
  heroVideoUrl?: string | null;
  heroPoster?: SanityImageSource | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  brandAddress?: string | null;
  whatsappNumber?: string | null;
  whatsappSuggestedMessage?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  googleReviewsUrl?: string | null;
  cartPromoBanner?: string | null;
  trustBadgeText?: string | null;
  rewardEnabled?: boolean | null;
  rewardThreshold?: number | null;
  rewardDescription?: string | null;
}

const EMPTY_SETTINGS: StoreSettings = { rewardEnabled: false };

/**
 * Single source of truth for admin-configurable site-wide settings — the
 * homepage hero (video/tagline), contact/brand info (previously hardcoded
 * and duplicated across ~8 files, which had already drifted out of sync —
 * e.g. Footer.tsx's phone number didn't match the one everywhere else), the
 * footer's Google rating badge and WhatsApp button, and the cart drawer's
 * reward banner. All off/empty by default so the site still renders
 * sensible fallbacks before an admin configures anything in Sanity (Store
 * Settings).
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (!sanityConfigured) return EMPTY_SETTINGS;
  try {
    const settings = await sanityClient.fetch<RawStoreSettings | null>(
      `*[_id == "storeSettings"][0]{
        announcementMessages,
        tagline,
        "heroVideoUrl": heroVideo.asset->url,
        heroPoster,
        contactEmail,
        contactPhone,
        brandAddress,
        whatsappNumber,
        whatsappSuggestedMessage,
        googleRating,
        googleReviewCount,
        googleReviewsUrl,
        cartPromoBanner,
        trustBadgeText,
        rewardEnabled,
        rewardThreshold,
        rewardDescription
      }`,
      {},
      SANITY_FETCH_OPTIONS,
    );
    if (!settings) return EMPTY_SETTINGS;
    const announcementMessages = (settings.announcementMessages ?? []).filter((message) => message.trim().length > 0);
    let heroPosterUrl: string | undefined;
    try {
      heroPosterUrl = settings.heroPoster ? urlForImage(settings.heroPoster).width(1920).fit("max").url() : undefined;
    } catch {
      heroPosterUrl = undefined;
    }
    return {
      announcementMessages: announcementMessages.length > 0 ? announcementMessages : undefined,
      tagline: settings.tagline ?? undefined,
      heroVideoUrl: settings.heroVideoUrl ?? undefined,
      heroPosterUrl,
      contactEmail: settings.contactEmail ?? undefined,
      contactPhone: settings.contactPhone ?? undefined,
      brandAddress: settings.brandAddress ?? undefined,
      whatsappNumber: settings.whatsappNumber ?? undefined,
      whatsappSuggestedMessage: settings.whatsappSuggestedMessage ?? undefined,
      googleRating: settings.googleRating ?? undefined,
      googleReviewCount: settings.googleReviewCount ?? undefined,
      googleReviewsUrl: settings.googleReviewsUrl ?? undefined,
      cartPromoBanner: settings.cartPromoBanner ?? undefined,
      trustBadgeText: settings.trustBadgeText ?? undefined,
      rewardEnabled: Boolean(settings.rewardEnabled && settings.rewardThreshold),
      rewardThreshold: settings.rewardThreshold ?? undefined,
      rewardDescription: settings.rewardDescription ?? undefined,
    };
  } catch {
    return EMPTY_SETTINGS;
  }
}
