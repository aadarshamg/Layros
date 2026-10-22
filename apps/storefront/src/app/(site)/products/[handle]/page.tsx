import "./product-page.css";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/seo/jsonld/product";
import { productBreadcrumbJsonLd } from "@/lib/seo/jsonld/breadcrumb";
import { getProductSeo } from "@/lib/seo/product-seo";
import { getProductByHandle, getRenamedProductHandle, getSimilarProducts } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/store-settings";
import { AddToCartForm, type PurchasePerk } from "@/components/product/AddToCartForm";
import { NoteIcon } from "@/components/product/NoteIcon";
import { ProductQualityHighlights } from "@/components/product/ProductQualityHighlights";
import { PerfumeConcentrationGuide } from "@/components/product/PerfumeConcentrationGuide";
import { ProductFaqs } from "@/components/product/ProductFaqs";
import { ProductInterestTracker } from "@/components/product/ProductInterestTracker";
import { ProductRatingLine } from "@/components/product/ProductRatingLine";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductGallery } from "@/components/product/ProductGallery";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { CategoryCouponOffers } from "@/components/product/CategoryCouponOffers";
import { getProductCouponCategory, isBuyTwoGetOneEligible } from "@/lib/promotions";
import { concentrationLabel, genderLabel, productNotePyramid } from "@/lib/product-labels";
import { DeliveryTimeline } from "@/components/product/DeliveryTimeline";
import { DEFAULT_DELIVERY_DAYS_MAX, DEFAULT_DELIVERY_DAYS_MIN, DEFAULT_DISPATCH_DAYS } from "@/lib/site-defaults";
import { formatInr, formatSize } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/shipping";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return buildMetadata({ title: "Fragrance", description: "", path: `/products/${handle}` });
  const seo = getProductSeo(product);
  return buildMetadata({
    title: `${seo.name} – ${seo.audience}`,
    description: seo.description,
    path: `/products/${handle}`,
    image: product.images[0],
    keywords: [...seo.keywords],
  });
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [product, rewardSettings] = await Promise.all([getProductByHandle(handle), getStoreSettings()]);
  if (!product) {
    // An old (longer) product URL: send it, and its search ranking, to the current one.
    const renamed = await getRenamedProductHandle(handle);
    if (renamed) permanentRedirect(`/products/${renamed}`);
    notFound();
  }

  const relatedProducts = await getSimilarProducts([product.id], 4);

  const { details } = product;
  const images = product.images.length ? product.images : ["/leyros/nuit-doree-hero.jpg"];

  const isFragrance = isBuyTwoGetOneEligible(product);
  const isPerfume = isFragrance && !/attar/i.test(product.category ?? "");
  const seo = getProductSeo(product);
  const shortProductName = seo.name;
  const couponCategory = getProductCouponCategory(product);
  const gender = genderLabel(product);
  const kicker = !gender ? seo.category : gender === "Unisex" ? `Unisex ${seo.category}` : `${seo.category} for ${gender}`;
  // Only the "when to wear" highlights managed in admin; category, family,
  // gender and sizes are already shown elsewhere on the page.
  const noteGroups = isFragrance ? productNotePyramid(product) : [];
  // One lead note per layer, e.g. "Neroli. Lavender. Amber."
  const tagline = noteGroups.length > 1 ? `${noteGroups.map((group) => group.notes[0]).join(". ")}.` : undefined;
  // Real offers only: the free-shipping threshold, Buy 2 Get 1 on perfumes and
  // attars, and the gift from Store Settings when it is switched on.
  const perks: PurchasePerk[] = [
    { key: "shipping", value: formatInr(FREE_SHIPPING_THRESHOLD), label: "Free shipping", icon: "truck", minAmount: FREE_SHIPPING_THRESHOLD },
    ...(isFragrance ? [{ key: "b2g1", value: "Any 3", label: "1 of them free", icon: "bottles" as const, minQuantity: 3 }] : []),
    ...(rewardSettings.rewardEnabled && rewardSettings.rewardThreshold
      ? [{ key: "gift", value: formatInr(rewardSettings.rewardThreshold), label: "Free gift", icon: "gift" as const, minAmount: rewardSettings.rewardThreshold }]
      : []),
  ];
  return (
    <div className="product-page">
      <JsonLd data={productJsonLd(product, product.reviewCount && product.reviewAverage ? { value: product.reviewAverage, count: product.reviewCount } : undefined)} />
      <JsonLd data={productBreadcrumbJsonLd({ handle: product.handle, name: seo.name, category: seo.category })} />
      <ProductInterestTracker productId={product.id} />
      <section className="product-hero">
        <nav className="page-shell product-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/collections/all">{seo.category}</Link><span>/</span><span>{shortProductName}</span>
        </nav>
        <div className="page-shell product-hero-grid">
          <ProductGallery title={product.title} images={images} videoUrl={product.videoUrl} />
          <aside className="product-info">
            <header className="product-identity">
              <p className="product-kicker">{kicker}</p>
              <h1>{shortProductName}</h1>
              <ProductRatingLine
                handle={product.handle}
                count={product.reviewCount}
                average={product.reviewAverage}
                amazonRating={product.amazonRating}
                amazonRatingCount={product.amazonRatingCount}
                amazonUrl={product.amazonUrl}
              />
            </header>
            <AddToCartForm
              productId={product.id}
              handle={product.handle}
              title={product.title}
              category={product.category}
              image={images[0]}
              variants={product.variants}
              tagline={tagline}
              perks={perks}
            />
            {couponCategory && <CategoryCouponOffers category={couponCategory} />}
            <div className="product-service-line"><span>Secure checkout</span><span>Order tracking</span></div>
            <div className="product-purchase-details">
              <details>
                <summary>Delivery & shipping <span>From {formatInr(FREE_SHIPPING_THRESHOLD)}, shipping is on us</span></summary>
                <DeliveryTimeline
                  dispatchDays={rewardSettings.dispatchDays ?? DEFAULT_DISPATCH_DAYS}
                  deliveryDaysMin={rewardSettings.deliveryDaysMin ?? DEFAULT_DELIVERY_DAYS_MIN}
                  deliveryDaysMax={rewardSettings.deliveryDaysMax ?? DEFAULT_DELIVERY_DAYS_MAX}
                />
                <p>Free shipping on orders of {formatInr(FREE_SHIPPING_THRESHOLD)} or more. {formatInr(STANDARD_SHIPPING_FEE)} below that.</p>
              </details>
              {rewardSettings.rewardEnabled && rewardSettings.rewardThreshold && (
                <details>
                  <summary>A little extra, from Leyros <span>Complimentary on orders over {formatInr(rewardSettings.rewardThreshold)}</span></summary>
                  <p>{rewardSettings.rewardDescription || "A complimentary gift"} on orders over {formatInr(rewardSettings.rewardThreshold)}. Added automatically at checkout.</p>
                </details>
              )}
            </div>
          </aside>
        </div>
      </section>

      {noteGroups.length > 0 && (
        <section className="product-notes-section" aria-labelledby="fragrance-notes-title">
          <div className="page-shell">
            <h2 id="fragrance-notes-title">Notes</h2>
            <div className="product-note-grid">
              {noteGroups.map((group) => (
                <article key={group.title} className="product-note-group">
                  <h3>{group.title}</h3>
                  <ul className="product-note-list">
                    {group.notes.map((note) => (
                      <li className="product-note" key={note}>
                        <NoteIcon note={note} />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {isFragrance && (
        <section className="product-offer-band" aria-label="Buy 2, get 1 free">
          <div className="page-shell product-offer-band-inner">
            <div className="product-offer-band-copy">
              <span>Buy any 2</span>
              <strong>Get 1 free</strong>
              <small>Receive 3 perfume bottles. Pay for only 2.</small>
              <Link href="/collections/all?category=collections">Shop now</Link>
            </div>
            <div className="product-offer-band-image">
              <Image src="/leyros/hero-products-green-v3.png" alt="Leyros Aventra, Aqualis and Veloria fragrances" fill sizes="(max-width: 650px) 100vw, 45vw" />
            </div>
            <div className="product-offer-band-reward">
              <span className="offer-reward-eyebrow">3 perfume bottles in total</span>
              <strong>Pay for 2.</strong>
              <div className="offer-reward-gift" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 4h12v8H18zM21 12h6v6h-6zM10 18h28v26H10zM17 27h14v9H17z" /></svg>
              </div>
              <p>1 bottle + 1 bottle + 1 free bottle.<br />Choose all 3; the lowest-priced bottle is free.</p>
              <small>Applied automatically in your bag.</small>
            </div>
          </div>
        </section>
      )}

      <section className="product-description-section" aria-labelledby="product-description-title">
        <div className="page-shell">
          <h2 id="product-description-title">Product description</h2>
          {product.description && <p className="product-full-description">{product.description}</p>}
          {isPerfume && <ProductQualityHighlights />}
          {isPerfume && (
            <div className="product-key-features">
              <h2>Key features &amp; benefits</h2>
              <ul>
                <li><strong>{concentrationLabel(product.details.concentration)}</strong><span>A concentrated composition with a lasting scent trail.</span></li>
                <li><strong>Up to 12 hours of wear</strong><span>Wear time varies with skin, weather, and application.</span></li>
                {noteGroups.length > 0 && <li><strong>A fragrance that unfolds</strong><span>{noteGroups.map((group) => `${group.title}: ${group.notes.join(", ")}`).join(". ")}.</span></li>}
                {product.highlights?.some((highlight) => highlight.title) && <li><strong>Made for your moments</strong><span>{product.highlights.map((highlight) => highlight.title).filter(Boolean).join(" · ")}</span></li>}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="product-detail-section" aria-labelledby="product-details-title">
        <div className="page-shell product-detail-layout">
          <div className="product-details-heading">
            <span>The essentials</span>
            <h2 id="product-details-title">Product details</h2>
            <p>Everything you need to choose your fragrance with confidence.</p>
          </div>
          <div>
            <div className="product-detail-summary" aria-label="Key product details">
              {isFragrance && <article><span>Fragrance profile</span><strong>{details.family}</strong></article>}
              <article><span>For</span><strong>{gender ?? "Everyone"}</strong></article>
              {isFragrance && <article><span>Concentration</span><strong>{isPerfume ? "30% Pure Parfum" : details.concentration}</strong></article>}
              <article><span>Available sizes</span><strong>{product.variants.map((variant) => formatSize(variant.sizeMl, variant.sizeLabel)).join(" · ")}</strong></article>
            </div>
            <div className="product-disclosures">
              {!isFragrance && product.tags.length > 0 && (
                <details>
                  <summary>Product features</summary>
                  <p>{product.tags.join(", ")}.</p>
                </details>
              )}
              <details><summary>Delivery, tracking and returns</summary><p>Track your order from dispatch to delivery. Standard delivery across India takes 3 to 5 business days. Shipping is free on orders of {formatInr(FREE_SHIPPING_THRESHOLD)} or more and {formatInr(STANDARD_SHIPPING_FEE)} below that. Returns are accepted for items that arrive damaged, incorrect or faulty. Contact us within 7 days of delivery.</p></details>
            </div>
          </div>
        </div>
      </section>

      {isPerfume && <PerfumeConcentrationGuide />}
      <ProductFaqs product={product} />

      <ProductReviews productId={product.id} productName={shortProductName} count={product.reviewCount} average={product.reviewAverage} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
