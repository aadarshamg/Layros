import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld/organization";
import "./globals.css";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
