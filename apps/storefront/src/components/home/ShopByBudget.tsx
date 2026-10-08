import Link from "next/link";

const BUDGET_LINKS = [
  { label: "Perfumes Under ₹500", price: "₹500", href: "/collections/all?category=collections&maxPrice=500&sort=price-asc" },
  { label: "Perfumes Under ₹1,000", price: "₹1K", href: "/collections/all?category=collections&maxPrice=1000&sort=price-asc" },
  { label: "Perfumes Under ₹1,500", price: "₹1.5K", href: "/collections/all?category=collections&maxPrice=1500&sort=price-asc" },
  { label: "Long-Lasting Perfumes Under ₹500", price: "12H", href: "/collections/all?category=collections&maxPrice=500&benefit=long-lasting&sort=price-asc" },
  { label: "Festival Gifts Under ₹1,000", price: "Gift", href: "/collections/all?category=gift%20pack&maxPrice=1000&occasion=festival&sort=price-asc" },
  { label: "Home Décor Candles Under ₹200", price: "Glow", href: "/candles?maxPrice=200#candle-products" },
] as const;

export function ShopByBudget() {
  return (
    <section className="home-budget" aria-labelledby="home-budget-title">
      <div className="cinematic-shell">
        <header>
          <h2 id="home-budget-title">Shop by Budget</h2>
        </header>
        <div className="home-budget-grid">
          {BUDGET_LINKS.map((item) => (
            <Link href={item.href} key={item.label}>
              <span>{item.price}</span>
              <strong>{item.label}</strong>

            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
