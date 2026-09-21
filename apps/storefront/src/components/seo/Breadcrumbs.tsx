import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { breadcrumbListJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonld/breadcrumb";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-charcoal-soft/70">
      <JsonLd data={breadcrumbListJsonLd(items)} />
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-gold">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
