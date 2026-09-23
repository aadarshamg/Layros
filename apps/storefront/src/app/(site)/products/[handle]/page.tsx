import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/seo/jsonld/product";
import { getProductByHandle } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/store-settings";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductInterestTracker } from "@/components/product/ProductInterestTracker";
import { formatInr } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return buildMetadata({ title: "Fragrance", description: "", path: `/products/${handle}` });
  return buildMetadata({ title: product.title, description: product.description, path: `/products/${handle}`, image: product.images[0] });
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [product, rewardSettings] = await Promise.all([getProductByHandle(handle), getStoreSettings()]);
  if (!product) notFound();

  const { details } = product;
  const images = product.images.length ? product.images : ["/leyros/nuit-doree-hero.jpg"];
  const gallery = [images[0], images[1] ?? images[0], images[2] ?? images[0]];
  const mediaRail = images.length > 1
    ? images.slice(1, 4)
    : [images[0]];

  // Real migrated descriptions run long (the old site's full marketing
  // copy) — show a short excerpt up front and the rest in a disclosure
  // below, rather than a wall of text in the hero column.
  const SHORT_DESCRIPTION_LENGTH = 150;
  const shortDescription =
    product.description.length > SHORT_DESCRIPTION_LENGTH
      ? `${product.description.slice(0, SHORT_DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`
      : product.description;
  const hasFullDescription = product.description.length > shortDescription.length;
  const isFragrance = !product.category || /perfume|attar/i.test(product.category);
  const productAttributes = isFragrance
    ? [details.gender, details.family, details.concentration]
    : [product.category, ...product.tags].filter((attribute): attribute is string => Boolean(attribute)).slice(0, 3);
  const productAccord = isFragrance
    ? [details.notesTop[0], details.notesHeart[0], details.notesBase[0]].filter(Boolean).join(" · ")
    : product.tags.slice(0, 3).join(" · ");
  const registerData = [
    { title: "Head register · 0–30 minutes", share: "Radiant & vibrant", notes: details.notesTop },
    { title: "Heart register · 30 minutes–6 hours", share: "Velvety & refined", notes: details.notesHeart },
    { title: "Base register · 6–36 hours", share: "Nocturnal & enduring", notes: details.notesBase },
  ];
  const layering = [
    { image: "/leyros/dry-oil.jpg", title: `${product.title} Dry Body Elixir`, copy: "100ml · silky amber finish" },
    { image: "/leyros/candle.jpg", title: `${product.title} Soy & Brass Candle`, copy: "70-hour burn · atelier atmosphere" },
    { image: "/leyros/atomizer.jpg", title: "Milled Brass Pocket Atomizer", copy: "10ml · refillable travel ritual" },
  ];

  return (
    <div className="product-page">
      <JsonLd data={productJsonLd(product)} />
      <ProductInterestTracker productId={product.id} />
      <section className="product-hero">
        <div className="page-shell product-hero-grid">
          <div className="product-main-image">
            <Image src={gallery[0]} alt={`${product.title} extrait flacon`} fill priority sizes="(max-width: 1100px) 100vw, 42vw" />
            <span>Crafted in the Leyros atelier</span>
          </div>

          <div className="product-media-rail" aria-label={`${product.title} video and additional photos`}>
            {product.videoUrl && (
              <div className="product-media-video">
                <video controls muted loop playsInline preload="metadata" poster={mediaRail[0] ?? gallery[0]} aria-label={`${product.title} fragrance film`}>
                  <source src={product.videoUrl} type="video/mp4" />
                </video>
                <span>Fragrance film</span>
              </div>
            )}
            {mediaRail.map((image, index) => (
              <div className="product-detail-image" key={`${image}-${index}`}>
                <Image src={image} alt={`${product.title} detail ${index + 1}`} fill sizes="(max-width: 1100px) 50vw, 24vw" />
              </div>
            ))}
          </div>

          <div className="product-info">
            <h1 className={product.title.length > 52 ? "is-long" : undefined}>{product.title}</h1>
            <div className="product-attributes" aria-label="Product attributes">
              {productAttributes.map((attribute) => <span key={attribute}>{attribute}</span>)}
            </div>
            {productAccord && <p className="product-accord">{productAccord}</p>}
            <p className="product-description">{shortDescription}</p>
            <p className="product-price">₹{product.variants[0]?.price.toLocaleString("en-IN")}<span>Taxes included</span></p>
            <AddToCartForm
              productId={product.id}
              handle={product.handle}
              title={product.title}
              image={gallery[0]}
              variants={product.variants}
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
                    <div className="offer-image"><Image src="/leyros/atomizer.jpg" alt="Leyros miniature perfume atomizer" fill sizes="110px" /></div>
                  </article>
                  <article className="product-offer-card">
                    <span className="offer-rail">Delivery · Included</span>
                    <div className="offer-copy">
                      <h3>Complimentary white-glove delivery</h3>
                      <p>Insured shipping across India on orders over {formatInr(rewardSettings.rewardThreshold)}.</p>
                      <small>Applied automatically</small>
                    </div>
                    <div className="offer-image"><Image src="/leyros/coffret.jpg" alt="Leyros presentation coffret" fill sizes="110px" /></div>
                  </article>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="page-shell product-assurance-band" aria-label="Leyros service benefits">
          <article><b>Complimentary delivery</b><span>Insured shipping across India</span></article>
          <article><b>Atelier presentation</b><span>Elegant, gift-ready packaging</span></article>
          <article><b>Secure payment</b><span>Protected encrypted checkout</span></article>
        </div>
        <div className="page-shell product-detail-notes">
          <div className="product-disclosures">
            {hasFullDescription && (
              <details>
                <summary>Full description</summary>
                <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>
              </details>
            )}
            <details><summary>Fragrance composition</summary><p>{[...details.notesTop, ...details.notesHeart, ...details.notesBase].join(", ")}.</p></details>
            <details><summary>Presentation</summary><p>Presented in the signature Leyros coffret, ready to gift.</p></details>
            <details><summary>Delivery & returns</summary><p>Complimentary insured delivery across India. Unopened standard flacons may be returned within seven days.</p></details>
          </div>
        </div>
      </section>

      <section className="olfactory-section">
        <div className="page-shell olfactory-grid">
          <div className="olfactory-copy">
            <p className="eyebrow">Formulary matrix</p>
            <h2>The Olfactory Architecture</h2>
            <p>Formulated across 180 days of maceration, each register is calibrated from radiant citrus illumination to a resonant, low-volatility foundation.</p>
            <div className="note-registers">
              {registerData.map((register) => <article className="note-register" key={register.title}><header><span>{register.title}</span><span>{register.share}</span></header><p>{register.notes.join(", ") || "A private accord held within the Leyros formulary."}</p></article>)}
            </div>
          </div>
          <aside className="ingredient-card">
            <div className="ingredient-image"><Image src="/leyros/saffron.jpg" alt="Kashmiri saffron threads" fill sizes="(max-width: 800px) 90vw, 35vw" /></div>
            <h3>Atlas Valley Saffron Extract</h3>
            <p>Thousands of hand-picked Crocus sativus filaments yield a luminous leather-spice accord with exceptional diffusion and lasting warmth.</p>
          </aside>
        </div>
      </section>

      <section className="story-section">
        <div className="page-shell story-grid">
          <div className="story-image"><Image src="/leyros/portrait.jpg" alt={`Editorial portrait with ${product.title}`} fill sizes="(max-width: 800px) 90vw, 40vw" /></div>
          <div className="story-copy"><p className="eyebrow">Leyros atelier monograph</p><h2>A Symphony Crafted at the Edge of Twilight</h2><blockquote>“With {product.title}, my ambition was never merely to compose another amber scent, but to materialize the moment light turns to gold.”</blockquote><p>{details.story || "Every raw material is given time to settle into balance, preserving texture, radiance, and the quiet architecture of the final sillage."}</p><p className="product-kicker">{details.perfumer || "Maison Leyros"} · Master Perfumer</p></div>
        </div>
      </section>

      <section className="layering-section">
        <div className="page-shell">
          <div className="split-heading section-heading"><div><p className="eyebrow">Harmonious accords</p><h2>Complete the Olfactory Wardrobe</h2></div><Link href="/collections/all" className="text-link">Explore all layering rituals ↗</Link></div>
          <div className="layering-grid">{layering.map((item) => <article className="layer-card" key={item.title}><div className="layer-image"><Image src={item.image} alt={item.title} fill sizes="(max-width: 800px) 90vw, 33vw" /></div><h3>{item.title}</h3><p>{item.copy}</p><button type="button">Add to ritual</button></article>)}</div>
        </div>
      </section>
    </div>
  );
}
