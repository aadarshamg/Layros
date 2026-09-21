import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export function LegalPageLayout({
  title,
  path,
  updated,
  children,
}: {
  title: string;
  path: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="page-shell section-pad">
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: title, url: path }]} />
      <div className="section-heading" style={{ marginTop: 24 }}>
        <p className="eyebrow with-rule">Legal</p>
        <h1>{title}</h1>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: 12, marginBottom: 32 }}>Last updated: {updated}</p>
      <div style={{ maxWidth: 720, display: "grid", gap: 24, color: "var(--ink-soft)", fontFamily: "var(--font-playfair)", fontSize: 16, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}
