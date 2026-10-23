import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { getStoreSettings } from "@/lib/data/store-settings";
import { CATEGORY_COUPON_OFFERS, COUPON_CATEGORY_LABELS, PREPAID_DISCOUNT } from "@/lib/promotions";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/shipping";
import { formatInr } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Offers",
  description: "Every live Leyros offer in one place: Buy 2 Get 1 Free on perfumes and attars, category coupons, free shipping over ₹999 and a free gift on bigger orders.",
  path: "/offers",
});

// Every rule here mirrors the checkout's own code (lib/promotions.ts,
// lib/shipping.ts, Store Settings), so the page and the bill always agree.
export default async function OffersPage() {
  const settings = await getStoreSettings();
  const coupons = Object.values(CATEGORY_COUPON_OFFERS).flat();
  return (
    <div className="content-page page-shell section-pad offers-page">
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Offers", url: "/offers" }]} />
      <div className="section-heading content-page-hero" style={{ marginTop: 24 }}>
        <p className="eyebrow with-rule">Offers</p>
        <h1>Every offer, in one place</h1>
      </div>

      <section className="offers-block" aria-labelledby="offer-b2g1">
        <h2 id="offer-b2g1">Buy 2, Get 1 Free</h2>
        <p>Add any three eligible bottles to your bag and the lowest-priced one is free. Six bottles get two free, nine get three, and so on. The discount appears in your bag automatically; no code needed.</p>
        <div className="offers-columns">
          <div>
            <h3>Counts toward the offer</h3>
            <ul>
              <li>Perfumes (every size)</li>
              <li>Attars</li>
              <li>Discovery sets</li>
            </ul>
          </div>
          <div>
            <h3>Not included</h3>
            <ul>
              <li>Luxury gift packs and gift sets</li>
              <li>Candles</li>
              <li>Car perfumes</li>
              <li>Travel packs</li>
            </ul>
          </div>
        </div>
        <p className="offers-example">Example: two perfumes at ₹699 and one at ₹999 come to ₹2,397; the ₹699 bottle is free, so you pay ₹1,698.</p>
        <Link href="/collections/all?category=collections" className="button button-dark">Choose your 3 bottles</Link>
      </section>

      <section className="offers-block" aria-labelledby="offer-coupons">
        <h2 id="offer-coupons">Category coupons</h2>
        <p>Enter a code in your bag. Each works on its own category and can be used alongside Buy 2, Get 1 Free on perfumes in the same order.</p>
        <div className="offers-table-wrap">
          <table className="offers-table">
            <thead><tr><th scope="col">Code</th><th scope="col">Discount</th><th scope="col">On</th><th scope="col">Minimum spend</th></tr></thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.code}>
                  <td><code>{coupon.code}</code></td>
                  <td>{coupon.percent}% off</td>
                  <td>{COUPON_CATEGORY_LABELS[coupon.category]}</td>
                  <td>{formatInr(coupon.minimum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="offers-block" aria-labelledby="offer-prepaid">
        <h2 id="offer-prepaid">{formatInr(PREPAID_DISCOUNT)} off when you pay online</h2>
        <p>Pay by card, UPI or netbanking at checkout and {formatInr(PREPAID_DISCOUNT)} comes off your order, on top of every other offer. Cash on Delivery orders pay the full amount.</p>
      </section>

      <section className="offers-block" aria-labelledby="offer-shipping">
        <h2 id="offer-shipping">Free shipping</h2>
        <p>Free shipping across India on orders of {formatInr(FREE_SHIPPING_THRESHOLD)} or more; below that, shipping is {formatInr(STANDARD_SHIPPING_FEE)}. Orders ship within 24–48 hours and arrive in 3–5 business days.</p>
      </section>

      {settings.rewardEnabled && settings.rewardThreshold && (
        <section className="offers-block" aria-labelledby="offer-gift">
          <h2 id="offer-gift">A free gift on bigger orders</h2>
          <p>{settings.rewardDescription || "A complimentary gift"} on orders of {formatInr(settings.rewardThreshold)} or more, added to your parcel.</p>
        </section>
      )}

      <p className="offers-note">Offers apply to the price after any MRP discount, and the bag shows exactly what you pay before checkout. Questions? See our <Link href="/legal/terms">terms</Link> or <Link href="/contact">contact us</Link>.</p>
    </div>
  );
}
