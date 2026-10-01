const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productBreadcrumbJsonLd({ handle, name, category }: { handle: string; name: string; category: string }) {
  return breadcrumbListJsonLd([
    { name: "Home", url: siteUrl },
    { name: category, url: `${siteUrl}/collections/all` },
    { name, url: `${siteUrl}/products/${handle}` },
  ]);
}
