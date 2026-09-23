"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_FILTER_OPTIONS } from "@/lib/data/categories";

const families = ["floral", "woody", "oriental", "fresh", "gourmand"];
const genders = ["unisex", "feminine", "masculine"];

export function CollectionControls({ count }: { count: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inStock = searchParams.get("inStock") !== "0";
  const sort = searchParams.get("sort") ?? "recommended";
  const activeCategory = searchParams.get("category") ?? "";
  const activeFamily = searchParams.get("family") ?? "";
  const activeGender = searchParams.get("gender") ?? "";
  const activeFilterCount = Number(inStock) + Number(Boolean(activeCategory)) + Number(Boolean(activeFamily)) + Number(Boolean(activeGender));

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("category");
    next.delete("family");
    next.delete("gender");
    next.set("inStock", "0");
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  return (
    <div className="collection-controls">
      <div className="collection-controls-bar">
        <span className="collection-result-count">{count} products</span>
        <div className="collection-control-actions">
          <button
            type="button"
            className={`stock-filter-chip${inStock ? " is-active" : ""}`}
            onClick={() => updateParam("inStock", inStock ? "0" : "1")}
            aria-pressed={inStock}
          >
            In Stock <span aria-hidden="true">{inStock ? "×" : "+"}</span>
          </button>
          <button
            type="button"
            className={`filter-toggle${filtersOpen ? " is-active" : ""}`}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="collection-filter-panel"
          >
            Filter <span className="filter-sliders" aria-hidden="true"><i /><i /><i /></span>
            {activeFilterCount > 1 && <b>{activeFilterCount}</b>}
          </button>
          <label className="collection-sort">
            <span>Sort ↕</span>
            <select value={sort} onChange={(event) => updateParam("sort", event.target.value)} aria-label="Sort products">
              <option value="recommended">Recommended</option>
              <option value="new">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>
      </div>

      {filtersOpen && (
        <div className="collection-filter-panel" id="collection-filter-panel">
          <div className="filter-group">
            <strong>Category</strong>
            <div>{CATEGORY_FILTER_OPTIONS.map((option) => (
              <button key={option.label} type="button" className={activeCategory === option.value ? "is-selected" : undefined} onClick={() => updateParam("category", option.value)}>{option.label}</button>
            ))}</div>
          </div>
          <div className="filter-group">
            <strong>Fragrance family</strong>
            <div>{families.map((family) => (
              <button key={family} type="button" className={activeFamily === family ? "is-selected" : undefined} onClick={() => updateParam("family", activeFamily === family ? "" : family)}>{family}</button>
            ))}</div>
          </div>
          <div className="filter-group">
            <strong>For</strong>
            <div>{genders.map((gender) => (
              <button key={gender} type="button" className={activeGender === gender ? "is-selected" : undefined} onClick={() => updateParam("gender", activeGender === gender ? "" : gender)}>{gender}</button>
            ))}</div>
          </div>
          <button type="button" className="clear-collection-filters" onClick={clearFilters}>Clear all filters</button>
        </div>
      )}
    </div>
  );
}
