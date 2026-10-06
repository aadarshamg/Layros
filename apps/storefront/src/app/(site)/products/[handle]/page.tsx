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
import { getScentStoryTheme, scentNoteImage, scentStoryNarrative } from "@/lib/scent-story";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/shipping";
import { RotatingHighlights } from "@/components/product/RotatingHighlights";
import type { CSSProperties } from "react";

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

  // Prefer complete sentences in the purchase panel; keep the full copy below.
  const SHORT_DESCRIPTION_LENGTH = 220;
  const cleanDescription = product.description.replace(/[\u200B\uFEFF]/g, "").replace(/\.(?=[A-Z])/g, ". ").trim();
  const excerpt = cleanDescription.slice(0, SHORT_DESCRIPTION_LENGTH);
  const sentenceEnd = excerpt.lastIndexOf(".");
  const shortDescription =
    cleanDescription.length > SHORT_DESCRIPTION_LENGTH
      ? sentenceEnd > 60 ? excerpt.slice(0, sentenceEnd + 1) : `${excerpt.replace(/\s+\S*$/, "")}…`
      : cleanDescription;
  const hasFullDescription = cleanDescription.length > shortDescription.length;
  const isFragrance = isBuyTwoGetOneEligible(product);
  const seo = getProductSeo(product);
  const shortProductName = seo.name;
  const couponCategory = getProductCouponCategory(product);
  // Only the "when to wear" highlights managed in admin; category, family,
  // gender and sizes are already shown elsewhere on the page.
  const featureList = (isFragrance ? [...details.notesTop, ...details.notesHeart, ...details.notesBase] : product.tags).filter(Boolean);
  const topFacts = product.highlights?.map((highlight) => highlight.title) ?? [];
  const scentTheme = getScentStoryTheme(product);
  const scentStoryStyle = isFragrance
    ? ({
        "--scent-bg": scentTheme.background,
        "--scent-surface": scentTheme.surface,
        "--scent-accent": scentTheme.accent,
        "--scent-ink": scentTheme.ink,
        "--scent-angle": scentTheme.angle,
      } as CSSProperties)
    : undefined;
  const scentStory = isFragrance ? scentStoryNarrative(product, shortProductName) : "";
  const noteChapters = isFragrance
    ? [
        { number: "01", label: "The opening", title: "Top notes", notes: details.notesTop, image: scentNoteImage(details.notesTop, images[0]) },
        { number: "02", label: "The heart", title: "Heart notes", notes: details.notesHeart, image: scentNoteImage(details.notesHeart, images[Math.min(1, images.length - 1)]) },
        { number: "03", label: "The trail", title: "Base notes", notes: details.notesBase, image: scentNoteImage(details.notesBase, images[Math.min(2, images.length - 1)]) },
      ]
    : [];
  return (
    <div className={`product-page${isFragrance ? " scent-story-page" : ""}`} style={scentStoryStyle}>
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
              <ProductRatingLine handle={product.handle} count={product.reviewCount} average={product.reviewAverage} />
            </header>
            <p className="product-description">{shortDescription}</p>
            {isFragrance && (
              <div className="product-quick-facts" aria-label="Product summary">
                <div><span>Profile</span><strong>{details.family}</strong></div>
                <div><span>Concentration</span><strong>{details.concentration}</strong></div>
                <div><span>Presence</span><strong>{details.intensity}</strong></div>
              </div>
            )}
            {topFacts.length > 0 && <RotatingHighlights highlights={product.highlights} seed={product.id} />}
            {isFragrance && (
              <div className="product-offer-card">
                <span>Limited offer</span>
                <div><strong>Buy 2, get 1 free</strong><p>Add any 3 eligible Perfumes or Attars. The lowest-priced eligible item is free.</p></div>
              </div>
            )}
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
        <section className="product-scent-story" aria-labelledby="scent-story-title">
          <div className="page-shell product-story-intro">
            <div className="product-story-heading">
              <span>#ScentStory</span>
              <p>{scentTheme.mood}</p>
            </div>
            <div className="product-story-copy">
              <p className="product-story-chapter">{scentTheme.chapter}</p>
              <h2 id="scent-story-title">A fragrance with a point of view.</h2>
              <p>{scentStory}</p>
            </div>
          </div>
          <div className="page-shell product-note-grid">
            {noteChapters.map((chapter) => (
              <article key={chapter.title} className="product-note-card">
                <Image src={chapter.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
                <div className="product-note-card-overlay" />
                <div className="product-note-card-copy">
                  <span>{chapter.number} · {chapter.label}</span>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.notes.length ? chapter.notes.join(" · ") : "A carefully composed impression"}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="page-shell product-story-ritual">
            <span>Wear it when</span><p>{scentTheme.ritual}</p>
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
              {(hasFullDescription || cleanDescription) && (
                <details open>
                  <summary>About this {isFragrance ? "fragrance" : "product"}</summary>
                  <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>
                </details>
              )}
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

      <ProductReviews productId={product.id} count={product.reviewCount} average={product.reviewAverage} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
