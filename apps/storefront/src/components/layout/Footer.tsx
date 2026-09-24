import Image from "next/image";
import Link from "next/link";
import { DEFAULT_CONTACT_EMAIL, DEFAULT_CONTACT_PHONE, DEFAULT_BRAND_ADDRESS } from "@/lib/site-defaults";
import { PinIcon, PhoneIcon, StarIcon, GoogleGIcon, FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/layout/FooterIcons";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61560384553176", Icon: FacebookIcon },
  { label: "Instagram", href: "https://www.instagram.com/leyrosperfume/", Icon: InstagramIcon },
  { label: "YouTube", href: "https://www.youtube.com/@LeyrosPerfume", Icon: YoutubeIcon },
];

// Real merchandising categories from the migrated catalog (same substring
// keyword-match convention as the top nav and collection filter chips) —
// mirrors the actual footer structure of the old site, not an invented one.
const HELP_LINKS = [
  { label: "Store Policies", href: "/legal/shipping-returns" },
  { label: "Track your Order", href: "/account/orders" },
  { label: "Request Return", href: "/contact" },
  { label: "Return Policy", href: "/legal/shipping-returns" },
  { label: "Privacy Policy", href: "/legal/privacy" },
];

const TOP_CATEGORY_LINKS = [
  { label: "Fragrance Candles", href: "/collections/all?category=candle" },
  { label: "Gift Pack (Celeb Perfumes)", href: `/collections/all?category=${encodeURIComponent("gift pack")}` },
  { label: "Attar Fragrances", href: "/collections/all?category=attar" },
  { label: "The Fresh, Citrus & Marine Collections", href: `/collections/all?category=${encodeURIComponent("fresh, citrus & marine")}` },
  { label: "The Ambry Collections", href: `/collections/all?category=${encodeURIComponent("ambry")}` },
  { label: "The Floral & Fruity Collections", href: `/collections/all?category=${encodeURIComponent("floral & fruity")}` },
  { label: "Festival Gift Packs", href: `/collections/all?category=${encodeURIComponent("gift pack")}` },
  { label: "Car Perfumes", href: `/collections/all?category=${encodeURIComponent("car perfume")}` },
  { label: "The Oud Collections", href: `/collections/all?category=${encodeURIComponent("oud")}` },
];

// Men's/Women's/Summer aren't real distinct groupings yet — the migrated
// catalog never tagged individual fragrances by gender or season (every
// product defaults to "unisex"), so these point at the full collection
// rather than a fabricated subset. Concrete candles and gift sets are real,
// title/category-verified subsets.
const COLLECTIONS_LINKS = [
  { label: "All Perfumes", href: "/collections/all?category=collections" },
  { label: "Soy-Gel Wax Candle Collection", href: "/collections/all?category=candle" },
  { label: "New Launch Perfumes 2026", href: "/collections/all?category=collections&sort=new" },
  { label: "Unisex Perfumes Collection", href: "/collections/all?category=collections" },
  { label: "Festival Gift Sets", href: `/collections/all?category=${encodeURIComponent("gift pack")}` },
  { label: "Summer Perfumes Collection", href: "/collections/all?category=collections" },
  { label: "Men Perfumes Collection", href: "/collections/all?category=collections" },
  { label: "Concrete Candle Collection", href: `/collections/all?category=candle&q=${encodeURIComponent("concrete")}` },
  { label: "Women Perfumes Collection", href: "/collections/all?category=collections" },
];

const MORE_LINKS = [{ label: "About Us", href: "/story" }];

const PAYMENT_BRANDS = [
  {
    label: "Visa",
    src: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg",
  },
  {
    label: "Mastercard",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg",
  },
  {
    label: "UPI",
    src: "https://upload.wikimedia.org/wikipedia/commons/6/6f/UPI_logo.svg",
  },
];

const PAYMENT_SERVICES = [
  { label: "Net Banking", src: "/payment-netbanking.svg" },
  { label: "Wallet", src: "/payment-wallet.svg" },
  { label: "Cash on Delivery", src: "/payment-cod.svg" },
];

export function Footer({
  contactEmail,
  contactPhone,
  brandAddress,
  googleRating,
  googleReviewCount,
  googleReviewsUrl,
}: {
  contactEmail?: string;
  contactPhone?: string;
  brandAddress?: string;
  googleRating?: number;
  googleReviewCount?: number;
  googleReviewsUrl?: string;
} = {}) {
  const email = contactEmail || DEFAULT_CONTACT_EMAIL;
  const phone = contactPhone || DEFAULT_CONTACT_PHONE;
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const address = brandAddress || DEFAULT_BRAND_ADDRESS;
  const hasRating = typeof googleRating === "number" && typeof googleReviewCount === "number";

  return (
    <footer className="site-footer" id="concierge">
      <div className="footer-grid page-shell">
        <div className="footer-intro">
          <Link href="/" className="footer-brand" aria-label="LEYROS home">
            <Image
              src="/leyros/leyros-logo-white.png"
              alt=""
              width={1280}
              height={1280}
              className="footer-brand-logo"
            />
          </Link>
          <p>Expressive fragrances made in Kannauj for modern Indian routines, moods, and memories.</p>

          <div className="footer-contact-line"><PinIcon /><span>{address}</span></div>
          <div className="footer-contact-line">
            <PhoneIcon />
            <span>
              Talk to us<br />
              <a href={phoneHref}>{phone}</a>
            </span>
          </div>

          {hasRating && (
            <a
              className="footer-rating-badge"
              href={googleReviewsUrl || `https://www.google.com/search?q=${encodeURIComponent("Leyros reviews")}`}
              target="_blank"
              rel="noreferrer"
            >
              <GoogleGIcon />
              <span className="footer-rating-stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} filled={i < Math.round(googleRating ?? 0)} />)}
              </span>
              <span className="footer-rating-text">{googleRating?.toFixed(1)} rating from {googleReviewCount} reviews</span>
            </a>
          )}

          <div className="footer-socials">
            <span>Connect with us</span>
            <div className="footer-social-icons">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon /></a>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4>Help</h4>
          <ul>
            {HELP_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h4>Top Categories</h4>
          <ul>
            {TOP_CATEGORY_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h4>Collections</h4>
          <ul>
            {COLLECTIONS_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h4>More</h4>
          <ul>
            {MORE_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
          </ul>
        </div>
      </div>

      <div className="footer-wordmark-wrap">
        <Link href="/" className="footer-wordmark" aria-label="LEYROS home">LEYROS</Link>
      </div>

      <div className="footer-bottom">
        <div className="page-shell footer-bottom-inner">
          <div className="footer-payment-methods">
            <span>We accept</span>
            {PAYMENT_BRANDS.map((brand) => (
              <span key={brand.label} className={`footer-payment-logo footer-payment-logo-${brand.label.toLowerCase()}`}>
                <img src={brand.src} alt={brand.label} loading="lazy" decoding="async" />
              </span>
            ))}
            {PAYMENT_SERVICES.map((method) => (
              <span key={method.label} className="footer-payment-badge">
                <img src={method.src} alt="" loading="lazy" decoding="async" />
                {method.label}
              </span>
            ))}
          </div>
          <span className="footer-copyright">
            © {new Date().getFullYear()} LEYROS · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/shipping-returns">Shipping &amp; Returns</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
