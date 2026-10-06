import Link from "next/link";
import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { ProductCardPurchasePanel } from "@/components/product/ProductCardPurchasePanel";
import { genderLabel, productCardTitle } from "@/lib/product-labels";
import { getProductBadge } from "@/lib/product-badge";
import { ProductBadgeIcon } from "@/components/product/ProductBadgeIcon";

// The % off is shown once, in the price box (ProductCardPurchasePanel), not
// again as a badge on the photo.
export function ProductCard({ product }: { product: PerfumeProduct }) {
  const gender = genderLabel(product);
  const displayTitle = productCardTitle(product);
  const badge = getProductBadge(product);

  return (
    <article className="product-card">
      <Link href={`/products/${product.handle}`} className="product-card-image">
        {product.images[0] && <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 700px) 50vw, 33vw" />}
        {badge && (
          <span className={`product-card-badge product-badge-${badge.tone}`}>
            <ProductBadgeIcon /> {badge.label}
          </span>
        )}
        {gender && <span className="product-gender-badge">{gender}</span>}
      </Link>
      <div className="product-card-body">
        <h3><Link href={`/products/${product.handle}`} className="product-name" aria-label={product.title} title={product.title}>{displayTitle}</Link></h3>
        <ProductCardPurchasePanel product={product} />
      </div>
    </article>
  );
}
