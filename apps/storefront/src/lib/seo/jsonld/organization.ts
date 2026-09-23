import { DEFAULT_CONTACT_EMAIL, DEFAULT_CONTACT_PHONE } from "@/lib/site-defaults";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function organizationJsonLd(contact?: { email?: string; phone?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LEYROS",
    alternateName: "Leyros",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: contact?.phone || DEFAULT_CONTACT_PHONE,
      contactType: "customer service",
      email: contact?.email || DEFAULT_CONTACT_EMAIL,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LEYROS",
    alternateName: "Leyros",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/collections/all?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
