"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_ANNOUNCEMENT_MESSAGES } from "@/lib/site-defaults";

interface NavLink {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

// Real merchandising categories from the migrated catalog (see
// apps/sanity-studio/scripts/migrate-live-catalog.mjs) — the Fragrance
// dropdown's children are the actual fragrance-family collections that
// exist in the catalog, not an invented taxonomy. Category matching is a
// substring keyword match against product.category (lib/data/products.ts's
// listProducts), same convention as the collection page's filter chips.
const links: NavLink[] = [
  {
    href: "/collections/all?category=collections",
    label: "Fragrance",
    children: [
      { href: "/collections/all?category=collections", label: "All Fragrances" },
      { href: `/collections/all?category=${encodeURIComponent("fresh, citrus & marine")}`, label: "Fresh, Citrus & Marine" },
      { href: `/collections/all?category=${encodeURIComponent("ambry")}`, label: "Ambry" },
      { href: `/collections/all?category=${encodeURIComponent("floral & fruity")}`, label: "Floral & Fruity" },
      { href: `/collections/all?category=${encodeURIComponent("woody & aromatic")}`, label: "Woody & Aromatic" },
      { href: `/collections/all?category=${encodeURIComponent("oud")}`, label: "Oud" },
      { href: `/collections/all?category=${encodeURIComponent("gourmand & sweet")}`, label: "Gourmand & Sweet" },
    ],
  },
  { href: "/collections/all?category=attar", label: "Attar Fragrance" },
  { href: `/collections/all?category=${encodeURIComponent("gift pack")}`, label: "Luxury Gift Pack" },
  { href: `/collections/all?category=${encodeURIComponent("car perfume")}`, label: "Car Perfumes" },
  { href: "/collections/all?sort=new", label: "New Launch" },
  { href: "/collections/all?category=candle", label: "Candles" },
  { href: "/story", label: "About Us" },
];

// Flattened for the vertical mobile/home menus. A parent's own href always
// duplicates its first child ("Fragrance" and "All Fragrances" both point
// at the same collection), so the parent itself is dropped here — its first
// child stands in as the top-level entry, and the rest are indented under it.
const flatLinks: (NavLink & { isChild?: boolean })[] = links.flatMap((link) => {
  if (!link.children) return [link];
  return link.children.map((child, index) => ({ ...child, isChild: index > 0 }));
});

export function NavView({ announcementMessages }: { announcementMessages?: string[] } = {}) {
  const isHome = usePathname() === "/";
  const announcements = announcementMessages?.length ? announcementMessages : DEFAULT_ANNOUNCEMENT_MESSAGES;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Reads 0 until the cart hydrates from localStorage on mount — same as
  // the old server-computed count showing 0 before Medusa responded.
  const { itemCount: bagCount, openDrawer } = useCart();
  const { isLoggedIn } = useAuth();
  const accountHref = isLoggedIn ? "/account/orders" : "/account/login";
  const accountLabel = isLoggedIn ? "My account" : "Log in";

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(false);
      return;
    }

    const updateHeader = () => setIsScrolled(window.scrollY > 48);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [isHome]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSearchOpen]);

  return (
    <header className={isHome ? `home-header${isScrolled ? " is-scrolled" : ""}` : "site-header"}>
      <div className="announcement">
        {announcements.map((message) => <span key={message}>{message}</span>)}
      </div>
      <div className="nav-shell">
        <details className="home-menu">
          <summary aria-label="Open menu"><span aria-hidden="true">☰</span> Menu</summary>
          <nav aria-label="Main navigation">
            {flatLinks.map((link) => (
              <Link key={link.href + link.label} href={link.href} className={link.isChild ? "nav-submenu-item" : undefined}>
                {link.label}
              </Link>
            ))}
            <Link href={accountHref}>{accountLabel}</Link>
            <button type="button" onClick={openDrawer} className="cursor-pointer text-left">Shopping bag ({bagCount})</button>
          </nav>
        </details>
        <Link href="/" className="wordmark" aria-label="LEYROS home">
          <span className="wordmark-mark">L</span>
          <span><b>LEYROS</b><small>PARIS · KANNAUJ</small></span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {links.map((link) =>
            link.children ? (
              <details className="nav-dropdown" key={link.label}>
                <summary>{link.label}</summary>
                <div className="nav-dropdown-menu">
                  {link.children.map((child) => <Link key={child.href} href={child.href}>{child.label}</Link>)}
                </div>
              </details>
            ) : (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ),
          )}
        </nav>
        <div className={`nav-actions${isSearchOpen ? " search-active" : ""}`}>
          {isSearchOpen ? (
            <form action="/collections/all" method="get" className="nav-search-form" onSubmit={() => setIsSearchOpen(false)}>
              <button type="submit" aria-label="Submit search" className="nav-search-submit"><span aria-hidden="true" /></button>
              <input type="search" name="q" placeholder="Search fragrances…" autoFocus aria-label="Search fragrances" />
              <button type="button" aria-label="Close search" className="nav-search-close" onClick={() => setIsSearchOpen(false)}>×</button>
            </form>
          ) : (
            <button type="button" aria-label="Search fragrances" className="nav-search-trigger" onClick={() => setIsSearchOpen(true)}><span>Search</span><span aria-hidden="true">⌕</span></button>
          )}
          <Link href={accountHref} aria-label={accountLabel} className="nav-account-link">{accountLabel}</Link>
          <button type="button" onClick={openDrawer} aria-label={`Shopping bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} className="bag-link cursor-pointer">
            <span className="bag-outline" aria-hidden="true" /><span className="bag-text">Bag</span><span className="bag-count">{bagCount}</span>
          </button>
          <details className="mobile-menu">
            <summary aria-label="Open menu">Explore</summary>
            <nav aria-label="Mobile navigation">
              {flatLinks.map((link) => (
                <Link key={link.href + link.label} href={link.href} className={link.isChild ? "nav-submenu-item" : undefined}>
                  {link.label}
                </Link>
              ))}
              <Link href={accountHref}>{accountLabel}</Link>
              <button type="button" onClick={openDrawer} className="cursor-pointer text-left">Shopping bag ({bagCount})</button>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
