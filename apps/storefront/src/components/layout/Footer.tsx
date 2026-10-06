import Image from "next/image";
import Link from "next/link";
import { DEFAULT_CONTACT_EMAIL, DEFAULT_CONTACT_PHONE, DEFAULT_BRAND_ADDRESS } from "@/lib/site-defaults";
import { PinIcon, PhoneIcon, StarIcon, GoogleGIcon, FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/layout/FooterIcons";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61560384553176", Icon: FacebookIcon },
  { label: "Instagram", href: "https://www.instagram.com/leyrosperfume/", Icon: InstagramIcon },
  { label: "YouTube", href: "https://www.youtube.com/@LeyrosPerfume", Icon: YoutubeIcon },
];

// Two short groups instead of four long ones: every destination once.
const PERFUMES = "/collections/all?category=collections";
const SHOP_LINKS = [
  { label: "All Perfumes", href: PERFUMES },
  { label: "Men", href: `${PERFUMES}&gender=masculine` },
  { label: "Women", href: `${PERFUMES}&gender=feminine` },
  { label: "Unisex", href: `${PERFUMES}&gender=unisex` },
  { label: "New Launch", href: `${PERFUMES}&sort=new` },
  { label: "Attars", href: "/collections/all?category=attar" },
  { label: "Candles", href: "/candles" },
  { label: "Gift Packs", href: `/collections/all?category=${encodeURIComponent("gift pack")}` },
  { label: "Car Perfumes", href: `/collections/all?category=${encodeURIComponent("car perfume")}` },
];

const HELP_LINKS = [
  { label: "Track your order", href: "/account/orders" },
  { label: "Shipping & returns", href: "/legal/shipping-returns" },
  { label: "Contact us", href: "/contact" },
  { label: "About Leyros", href: "/story" },
];

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

        <nav className="footer-links" aria-label="Footer">
          <div>
            <h4>Shop</h4>
            <ul>
              {SHOP_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              {HELP_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
            </ul>
          </div>
        </nav>
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
