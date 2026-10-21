import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function buildMetadata({
  title,
  description,
  path,
  image,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
}): Metadata {
  const url = `${siteUrl}${path}`;
  const socialImage = image || "/og.png";
  // The homepage title is used as written (it already carries the brand).
  const fullTitle = path === "/" ? title : `${title} | LEYROS`;
  return {
    title: { absolute: fullTitle },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "LEYROS",
      images: [{ url: socialImage, alt: `${title} by LEYROS` }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage],
    },
    robots: { index: true, follow: true },
  };
}
