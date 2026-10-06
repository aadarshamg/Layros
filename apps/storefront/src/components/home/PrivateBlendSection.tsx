import Image from "next/image";
import Link from "next/link";
import type { PerfumeProduct } from "@leyros/types";
import { isBuyTwoGetOneEligible } from "@/lib/promotions";
import { productCardName } from "@/lib/product-labels";

export function PrivateBlendSection({ products }: { products: PerfumeProduct[] }) {
  const blends = products.filter(isBuyTwoGetOneEligible).slice(0, 3);
  if (!blends.length) return null;

  return (
    <section className="private-blend-home" aria-labelledby="private-blend-home-title">
      <div className="cinematic-shell private-blend-home-grid">
        <header>
          <h2 id="private-blend-home-title">The Private Blend Edit</h2>
          <Link href="/private-blends">Enter the Private Blend story <i className="ui-inline-arrow" aria-hidden="true" /></Link>
        </header>
        <div className="private-blend-preview">
          {blends.map((product, index) => (
            <Link href={`/products/${product.handle}`} key={product.id}>
              <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 760px) 80vw, 22vw" />
              <span>Chapter 0{index + 1}</span>
              <div><strong>{productCardName(product)}</strong></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
