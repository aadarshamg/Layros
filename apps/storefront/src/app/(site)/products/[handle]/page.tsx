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
import { BuyTwoGetOneOffer } from "@/components/product/BuyTwoGetOneOffer";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { CategoryCouponOffers } from "@/components/product/CategoryCouponOffers";
import { getProductCouponCategory, isBuyTwoGetOneEligible } from "@/lib/promotions";
import { genderLabel } from "@/lib/product-labels";
import { DeliveryTimeline } from "@/components/product/DeliveryTimeline";
import { DEFAULT_DELIVERY_DAYS_MAX, DEFAULT_DELIVERY_DAYS_MIN, DEFAULT_DISPATCH_DAYS } from "@/lib/site-defaults";
import { formatInr, formatSize } from "@/lib/format";
import { ScentStory } from "@/components/product/ScentStory";
import { getScentStoryTheme } from "@/lib/scent-story";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/shipping";
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
    keywords: [...seo.keywords, "Leyros ScentStory", "perfume story"],
  });
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [product, rewardSettings] = await Promise.all([getProductByHandle(handle), getStoreSettings()]);
  if (!product) notFound();

  const relatedProducts = await getSimilarProducts([product.id], 4);

  const { details } = product;
  const images = product.images.length ? product.images : ["/leyros/nuit-doree-hero.jpg"];

  // Real migrated descriptions run long (the old site's full marketing
  // copy) — show a short excerpt up front and the rest in a disclosure
  // below, rather than a wall of text in the hero column.
  const SHORT_DESCRIPTION_LENGTH = 150;
  const shortDescription =
    product.description.length > SHORT_DESCRIPTION_LENGTH
      ? `${product.description.slice(0, SHORT_DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`
      : product.description;
  const hasFullDescription = product.description.length > shortDescription.length;
  const isFragrance = isBuyTwoGetOneEligible(product);
  const seo = getProductSeo(product);
  const shortProductName = seo.name;
  const gender = genderLabel(product);
  const audience = seo.audience;
  const couponCategory = getProductCouponCategory(product);
  const productAccord = isFragrance
    ? [details.notesTop[0], details.notesHeart[0], details.notesBase[0]].filter(Boolean).join(" · ")
    : product.tags.slice(0, 3).join(" · ");
  const topFacts = isFragrance
    ? [seo.category, seo.family, gender, details.concentration, seo.sizes, "30% concentration", productAccord, ...(product.highlights?.map((highlight) => highlight.title) ?? [])]
    : [seo.category, seo.sizes, ...product.tags];
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
  return (
    <div className={`product-page${isFragrance ? " scent-story-page" : ""}`} style={scentStoryStyle}>
      <JsonLd data={productJsonLd(product, product.reviewCount && product.reviewAverage ? { value: product.reviewAverage, count: product.reviewCount } : undefined)} />
      <JsonLd data={productBreadcrumbJsonLd({ handle: product.handle, name: seo.name, category: seo.category })} />
      <ProductInterestTracker productId={product.id} />
      <section className="product-hero">
        <nav className="page-shell product-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><span>{shortProductName}</span>
          {seo.family && <><span>/</span><span>{seo.family}</span></>}
          {gender && <><span>/</span><span>{gender}</span></>}
          <span>/</span><span>{audience}</span>
        </nav>
        <header className="page-shell product-identity">
          <p>{audience}</p>
          <h1>{shortProductName}</h1>
          <div className="product-top-facts" aria-label="Product summary">
            {topFacts.filter(Boolean).map((fact) => <span key={fact}>{fact}</span>)}
          </div>
          <ProductRatingLine handle={product.handle} count={product.reviewCount} average={product.reviewAverage} />
        </header>
        {isBuyTwoGetOneEligible(product) && <BuyTwoGetOneOffer />}
        <div className="page-shell product-hero-grid">
          <ProductGallery title={product.title} images={images} videoUrl={product.videoUrl} />

          <div className="product-info">
            <p className="product-description">{shortDescription}</p>
            <p className="product-price">₹{product.variants[0]?.price.toLocaleString("en-IN")}<span>Taxes included</span></p>
            {couponCategory && <CategoryCouponOffers category={couponCategory} />}
            <AddToCartForm
              productId={product.id}
              handle={product.handle}
              title={product.title}
              category={product.category}
              image={images[0]}
              variants={product.variants}
              fragranceFamily={isFragrance ? details.family : undefined}
            />
            <DeliveryTimeline
              dispatchDays={rewardSettings.dispatchDays ?? DEFAULT_DISPATCH_DAYS}
              deliveryDaysMin={rewardSettings.deliveryDaysMin ?? DEFAULT_DELIVERY_DAYS_MIN}
              deliveryDaysMax={rewardSettings.deliveryDaysMax ?? DEFAULT_DELIVERY_DAYS_MAX}
            />
            {rewardSettings.rewardEnabled && rewardSettings.rewardThreshold && (
              <section className="product-offers" aria-labelledby="product-offers-heading">
                <h2 id="product-offers-heading">Offers</h2>
                <div className="product-offer-grid">
                  <article className="product-offer-card">
                    <span className="offer-rail">Gift · Included</span>
                    <div className="offer-copy">
                      <h3>A miniature surprise for you</h3>
                      <p>{rewardSettings.rewardDescription || "A complimentary gift"} on orders over {formatInr(rewardSettings.rewardThreshold)}.</p>
                      <small>Added automatically at checkout</small>
                    </div>
                    <div className="offer-image"><Image src="/leyros/about-old/premium-attar.webp" alt="Leyros attar in a wooden gift box" fill sizes="110px" /></div>
                  </article>
                  <article className="product-offer-card">
                    <span className="offer-rail">Delivery · Included</span>
                    <div className="offer-copy">
                      <h3>Free shipping across India</h3>
                      <p>On orders of {formatInr(FREE_SHIPPING_THRESHOLD)} or more — {formatInr(STANDARD_SHIPPING_FEE)} below that.</p>
                      <small>Applied automatically</small>
                    </div>
                    <div className="offer-image"><Image src="/leyros/about-old/premium-perfume.webp" alt="Leyros eau de parfum in its presentation box" fill sizes="110px" /></div>
                  </article>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="page-shell product-assurance-band" aria-label="Leyros service benefits">
          <article><b>Free shipping ₹999+</b><span>Tracked delivery across India</span></article>
          <article><b>Atelier presentation</b><span>Elegant, gift-ready packaging</span></article>
          <article><b>Secure payment</b><span>Protected encrypted checkout</span></article>
        </div>
        <div className="page-shell product-detail-notes">
          <header className="product-details-heading">
            <span>Product details</span>
            <h2>Know your Leyros fragrance</h2>
            <p>Clear composition, performance, presentation, and delivery information—without the long editorial sections.</p>
          </header>
          {isFragrance && (
            <div className="product-detail-summary" aria-label="Key fragrance details">
              <article><span>Fragrance profile</span><strong>{details.family}</strong></article>
              <article><span>Concentration</span><strong>30% perfume oil</strong></article>
              <article><span>For</span><strong>{genderLabel(product) ?? "Unisex"}</strong></article>
              <article><span>Available sizes</span><strong>{product.variants.map((variant) => formatSize(variant.sizeMl, variant.sizeLabel)).join(" · ")}</strong></article>
            </div>
          )}
          <div className="product-disclosures">
            {hasFullDescription && (
              <details>
                <summary>About this fragrance</summary>
                <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>
              </details>
            )}
            <details>
              <summary>{isFragrance ? "Complete fragrance notes" : "Product features"}</summary>
              <p>{isFragrance ? [...details.notesTop, ...details.notesHeart, ...details.notesBase].join(", ") : product.tags.join(", ")}.</p>
            </details>
            <details><summary>Presentation</summary><p>Presented in the signature Leyros coffret, ready to gift.</p></details>
            <details><summary>Delivery, tracking & returns</summary><p>Track your order from dispatch to delivery. Standard delivery across India in 3–5 business days, free on orders of {formatInr(FREE_SHIPPING_THRESHOLD)} or more ({formatInr(STANDARD_SHIPPING_FEE)} below that). Returns are accepted for items that arrive damaged, incorrect or faulty — contact us within 7 days of delivery.</p></details>
          </div>
        </div>
      </section>

      {isFragrance && <ScentStory product={product} name={shortProductName} />}
      <ProductReviews productId={product.id} count={product.reviewCount} average={product.reviewAverage} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
