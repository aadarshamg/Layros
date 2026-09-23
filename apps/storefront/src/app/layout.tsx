import type { Metadata } from "next";
import { Outfit } from "next/font/google";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "LEYROS",
  title: {
    default: "LEYROS",
    template: "%s | LEYROS",
  },
  description: "LEYROS creates luxury fragrances from rare Indian botanicals with Parisian precision.",
  keywords: ["LEYROS", "luxury perfume", "Indian perfumery", "extrait de parfum", "personalized perfume"],
  authors: [{ name: "LEYROS" }],
  creator: "LEYROS",
  publisher: "LEYROS",
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "LEYROS",
    locale: "en_IN",
    title: "LEYROS",
    description: "Luxury fragrances shaped by rare Indian botanicals and Parisian precision.",
    images: [{ url: "/og.png", width: 1736, height: 907, alt: "LEYROS luxury fragrance house" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LEYROS",
    description: "Luxury fragrances shaped by rare Indian botanicals and Parisian precision.",
    images: ["/og.png"],
  },
};

// Deliberately minimal — the storefront's providers, nav/footer chrome, and
// globals.css live in (site)/layout.tsx instead of here, so the /admin
// route (the embedded Sanity Studio) renders with none of that. Studio
// needs full control of its own styling; the site's global CSS is written
// with very broad selectors (body, button, input, h1-h6, …) that would
// otherwise visually corrupt the Studio UI since both would share this <body>.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
