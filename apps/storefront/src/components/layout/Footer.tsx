import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer" id="concierge">
      <div className="footer-grid page-shell">
        <div className="footer-intro">
          <p className="eyebrow">L’Abonnement Olfactif</p>
          <h3>Rare extraits &amp; private salons.</h3>
          <p>Seasonal harvests, perfumer monographs, and private preview invitations, dispatched with restraint.</p>
          <form className="newsletter-form">
            <label className="sr-only" htmlFor="footer-email">Email address</label>
            <input id="footer-email" type="email" placeholder="ENTER YOUR EMAIL ADDRESS" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
        <div>
          <h4>Boutiques &amp; Salons</h4>
          <ul>
            <li><b>Mumbai</b>The Taj Mahal Palace, Colaba</li>
            <li><b>New Delhi</b>The Chanakya, Chanakyapuri</li>
            <li><b>Bengaluru</b>Lavelle Road, Shanthala Nagar</li>
            <li><b>Paris</b>Place Vendôme, 1er Arrondissement</li>
          </ul>
        </div>
        <div>
          <h4>Client Care</h4>
          <ul>
            <li><Link href="/contact">Private consultations</Link></li>
            <li><Link href="/samples">Discovery coffrets</Link></li>
            <li><Link href="/legal/shipping-returns">White-glove delivery</Link></li>
            <li><Link href="/gifting">Bespoke gifting</Link></li>
          </ul>
        </div>
        <div>
          <h4>Sustainable Glass</h4>
          <p>Hand-blown crystal engineered for replenishment. Return your flacon to any Leyros salon for a meticulous refill and seal renewal.</p>
          <span className="footer-accent">Zero-waste luxury artistry</span>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="page-shell">
          <span>© {new Date().getFullYear()} LEYROS</span>
          <span><Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/terms">Terms</Link> · IFRA transparency</span>
        </div>
      </div>
    </footer>
  );
}
