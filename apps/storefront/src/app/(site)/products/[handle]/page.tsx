import "./product-page.css";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/seo/jsonld/product";
import { productBreadcrumbJsonLd } from "@/lib/seo/jsonld/breadcrumb";
import { getProductSeo } from "@/lib/seo/product-seo";
import { getProductByHandle, getSimilarProducts } from "@/lib/data/products";
import { summarizeSampleReviews } from "@/lib/data/sample-reviews";
import { getStoreSettings } from "@/lib/data/store-settings";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductInterestTracker } from "@/components/product/ProductInterestTracker";
import { ProductRatingLine } from "@/components/product/ProductRatingLine";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductGallery } from "@/components/product/ProductGallery";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { CategoryCouponOffers } from "@/components/product/CategoryCouponOffers";
import { getProductCouponCategory, isBuyTwoGetOneEligible } from "@/lib/promotions";
import { genderLabel } from "@/lib/product-labels";
import { DeliveryTimeline } from "@/components/product/DeliveryTimeline";
import { DEFAULT_DELIVERY_DAYS_MAX, DEFAULT_DELIVERY_DAYS_MIN, DEFAULT_DISPATCH_DAYS } from "@/lib/site-defaults";
import { formatInr, formatSize } from "@/lib/format";
import { scentNoteImage } from "@/lib/scent-story";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/shipping";
import { RotatingHighlights } from "@/components/product/RotatingHighlights";

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
  if (!product) notFound();

  const relatedProducts = await getSimilarProducts([product.id], 4);

  const { details } = product;
  const images = product.images.length ? product.images : ["/leyros/nuit-doree-hero.jpg"];

  const isFragrance = isBuyTwoGetOneEligible(product);
  const seo = getProductSeo(product);
  const shortProductName = seo.name;
  const hasRealRating = Boolean(product.reviewCount && product.reviewAverage);
  const sampleRating = hasRealRating ? null : summarizeSampleReviews(product.id, shortProductName);
  const couponCategory = getProductCouponCategory(product);
  // Only the "when to wear" highlights managed in admin; category, family,
  // gender and sizes are already shown elsewhere on the page.
  const featureList = (isFragrance ? [...details.notesTop, ...details.notesHeart, ...details.notesBase] : product.tags).filter(Boolean);
  const topFacts = product.highlights?.map((highlight) => highlight.title) ?? [];
  const noteGroups = isFragrance
    ? [
        { title: "Top notes", notes: details.notesTop },
        { title: "Heart notes", notes: details.notesHeart },
        { title: "Base notes", notes: details.notesBase },
      ]
    : [];
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
              <div className="product-kicker-row">
                <p>{seo.category} · {genderLabel(product) ?? "Leyros collection"}</p>
                {isFragrance && <span className="product-kicker-badge">Buy 2, get 1 free</span>}
              </div>
              <h1>{shortProductName}</h1>
              <ProductRatingLine
                handle={product.handle}
                count={hasRealRating ? product.reviewCount : sampleRating?.count}
                average={hasRealRating ? product.reviewAverage : sampleRating?.average}
                isSample={!hasRealRating}
              />
            </header>
            {isFragrance && (
              <div className="product-quick-facts" aria-label="Product summary">
                <div><span>Profile</span><strong>{details.family}</strong></div>
                <div><span>Concentration</span><strong>{details.concentration}</strong></div>
                <div><span>Presence</span><strong>{details.intensity}</strong></div>
              </div>
            )}
            {topFacts.length > 0 && <RotatingHighlights highlights={product.highlights} seed={product.id} />}
            {couponCategory && <CategoryCouponOffers category={couponCategory} />}
            <AddToCartForm
              productId={product.id}
              handle={product.handle}
              title={product.title}
              category={product.category}
              image={images[0]}
              variants={product.variants}
            />
            <div className="product-service-line"><span>Small-batch blended</span><span>Secure checkout</span><span>Order tracking</span></div>
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

      {isFragrance && (
        <section className="product-notes-section" aria-labelledby="fragrance-notes-title">
          <div className="page-shell">
            <h2 id="fragrance-notes-title">Fragrance notes</h2>
            <div className="product-note-grid">
              {noteGroups.map((group) => (
                <article key={group.title} className="product-note-group">
                  <h3>{group.title}</h3>
                  <div className="product-note-list">
                    {group.notes.length ? group.notes.map((note) => (
                      <div className="product-note" key={note}>
                        <span className="product-note-image">
                          <Image src={scentNoteImage([note], images[0])} alt="" fill sizes="92px" />
                        </span>
                        <span>{note}</span>
                      </div>
                    )) : <p>A carefully composed impression</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

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
              <article><span>For</span><strong>{genderLabel(product) ?? "Everyone"}</strong></article>
              {isFragrance && <article><span>Concentration</span><strong>{details.concentration}</strong></article>}
              <article><span>Available sizes</span><strong>{product.variants.map((variant) => formatSize(variant.sizeMl, variant.sizeLabel)).join(" · ")}</strong></article>
            </div>
            <div className="product-disclosures">
              {featureList.length > 0 && (
                <details>
                  <summary>{isFragrance ? "Complete fragrance notes" : "Product features"}</summary>
                  <p>{featureList.join(", ")}.</p>
                </details>
              )}
              <details><summary>Delivery, tracking and returns</summary><p>Track your order from dispatch to delivery. Standard delivery across India takes 3 to 5 business days. Shipping is free on orders of {formatInr(FREE_SHIPPING_THRESHOLD)} or more and {formatInr(STANDARD_SHIPPING_FEE)} below that. Returns are accepted for items that arrive damaged, incorrect or faulty. Contact us within 7 days of delivery.</p></details>
            </div>
          </div>
        </div>
      </section>

      <ProductReviews productId={product.id} productName={shortProductName} count={product.reviewCount} average={product.reviewAverage} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
