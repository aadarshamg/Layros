const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LEYROS",
    alternateName: "Leyros",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-99150-82150",
      contactType: "customer service",
      email: "uknowmusic12@gmail.com",
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
