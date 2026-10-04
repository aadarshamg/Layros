"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelectors = [
  ".cinematic-section-title",
  ".product-of-month-grid > *",
  ".home-category-card",
  ".cinematic-product",
  ".cinematic-manifesto > *",
  ".cinematic-service-grid > *",
  ".faq-item",
  ".press-grid blockquote",
  ".finder-card",
  ".collection-intro > *",
  ".filter-bar",
  ".product-card",
  ".collection-architecture",
  ".collection-coffret > *",
  ".product-main-image",
  ".product-media-rail > *",
  ".product-info",
  ".product-assurance-band article",
  ".product-detail-notes",
  ".olfactory-grid > *",
  ".story-grid > *",
  ".layer-card",
  ".section-heading",
  ".footer-grid > *",
].join(",");

// Cards in a row that scrolls sideways (the phone carousels) would each stay
// invisible until swiped almost fully into view, so the next card peeks in
// blank and then pops. Those cards skip the reveal; desktop grids keep it.
function isInSidewaysScroller(element: HTMLElement) {
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowX } = getComputedStyle(node);
    if ((overflowX === "auto" || overflowX === "scroll") && node.scrollWidth > node.clientWidth + 1) return true;
  }
  return false;
}

export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(revealSelectors)).filter((element) => !isInSidewaysScroller(element));
    root.classList.add("motion-ready");

    targets.forEach((element, index) => {
      element.classList.add("reveal-item");
      element.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -36px" },
    );

    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
