"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/collections/all", label: "The Collection" },
  { href: "/collections/all?tag=signature", label: "Signature Scents" },
  { href: "/fragrance-finder", label: "Fragrance Finder" },
  { href: "/story", label: "The Atelier" },
];

export function NavView({ bagCount }: { bagCount: number }) {
  const isHome = usePathname() === "/";

  return (
    <header className={isHome ? "home-header" : "site-header"}>
      <div className="announcement">Complimentary bespoke sample coffret &amp; white-glove shipping across India on orders over ₹3,500</div>
      <div className="nav-shell">
        <details className="home-menu">
          <summary aria-label="Open menu"><span aria-hidden="true">☰</span> Menu</summary>
          <nav aria-label="Main navigation">
            {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            <Link href="/cart">Shopping bag ({bagCount})</Link>
          </nav>
        </details>
        <Link href="/" className="wordmark" aria-label="LEYROS home">
          <span className="wordmark-mark">L</span>
          <span><b>LEYROS</b><small>PARIS · KANNAUJ</small></span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="nav-actions">
          <Link href="/collections/all" aria-label="Search fragrances" className="nav-icon">⌕</Link>
          <span className="currency">INR ₹</span>
          <Link href="/contact" className="concierge">Concierge</Link>
          <Link href="/cart" aria-label={`Shopping bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} className="bag-link">
            <span className="bag-outline" aria-hidden="true" /><span className="bag-count">{bagCount}</span>
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Open menu">Menu</summary>
            <nav aria-label="Mobile navigation">
              {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
              <Link href="/cart">Shopping bag ({bagCount})</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
