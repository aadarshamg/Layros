import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/seo/jsonld/product";
import { getProductByHandle } from "@/lib/data/products";
import { AddToCartForm } from "@/components/product/AddToCartForm";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return buildMetadata({ title: "Fragrance", description: "", path: `/products/${handle}` });
  return buildMetadata({ title: product.title, description: product.description, path: `/products/${handle}`, image: product.images[0] });
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const { details } = product;
  const images = product.images.length ? product.images : ["/leyros/nuit-doree-hero.jpg"];
  const gallery = [images[0], images[1] ?? images[0], images[2] ?? images[0]];
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
      <section className="product-hero">
        <div className="page-shell product-hero-grid">
          <div className="product-gallery" aria-label={`${product.title} gallery`}>
            <div className="product-main-image">
              <Image src={gallery[0]} alt={`${product.title} extrait flacon`} fill priority sizes="(max-width: 820px) 100vw, 42vw" />
              <span>Personalised in the Leyros atelier</span>
            </div>
            <div className="product-gallery-side">
              {gallery.slice(1).map((image, index) => (
                <div className="product-detail-image" key={`${image}-${index}`}>
                  <Image src={image} alt={`${product.title} detail ${index + 1}`} fill sizes="(max-width: 820px) 50vw, 21vw" />
                </div>
              ))}
            </div>
          </div>

          <div className="product-info">
            <p className="product-kicker">Maison Leyros · {details.concentration.toLowerCase()} concentration</p>
            <h1>{product.title}</h1>
            <div className="product-proof"><span>✦ Atelier finished</span><span>Complimentary personalization</span></div>
            <p className="product-description">{product.description}</p>
            <p className="product-price">₹{product.variants[0]?.price.toLocaleString("en-IN")}<span>Taxes included</span></p>
            <AddToCartForm variants={product.variants} />
            <div className="product-services">
              <span><b>01</b>Dispatches in 24–48 hours</span>
              <span><b>02</b>Secure checkout</span>
              <span><b>03</b>Gift-ready packaging</span>
            </div>
            <div className="product-disclosures">
              <details><summary>Fragrance composition</summary><p>{[...details.notesTop, ...details.notesHeart, ...details.notesBase].join(", ")}.</p></details>
              <details><summary>Engraving & presentation</summary><p>Your inscription is applied by hand and presented in the signature Leyros coffret. Personalized flacons are final sale.</p></details>
              <details><summary>Delivery & returns</summary><p>Complimentary insured delivery across India. Unopened standard flacons may be returned within seven days.</p></details>
            </div>
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
