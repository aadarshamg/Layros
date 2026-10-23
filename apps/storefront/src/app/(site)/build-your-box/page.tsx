import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { listProducts } from "@/lib/data/products";
import { isBuyTwoGetOneEligible } from "@/lib/promotions";
import { productCardName } from "@/lib/product-labels";
import { defaultVariant } from "@/lib/variants";
import { isSoldOut } from "@/lib/stock";
import { BoxBuilder, type BoxProduct } from "./BoxBuilder";

export const metadata: Metadata = buildMetadata({
  title: "Build Your Box: Buy 2, Get 1 Free",
  description: "Pick any three Leyros perfumes and the lowest-priced one is free. See your box total as you choose, then add all three to your bag in one tap.",
  path: "/build-your-box",
});

export default async function BuildYourBoxPage() {
  const { products } = await listProducts({ category: "collections", limit: 200 });
  const choices: BoxProduct[] = products
    // Full-size perfumes only: the same products the offer counts, minus sets and samples.
    .filter((product) => isBuyTwoGetOneEligible(product) && product.images[0] && !/attar|tester|discovery|set of|gift/i.test(`${product.category ?? ""} ${product.title}`))
    .flatMap((product) => {
      const variant = defaultVariant(product.variants);
      if (!variant || isSoldOut(variant)) return [];
      return [{
        productId: product.id,
        handle: product.handle,
        title: product.title,
        name: productCardName(product),
        category: product.category,
        image: variant.image ?? product.images[0],
        variant: { id: variant.id, sku: variant.sku, sizeMl: variant.sizeMl, sizeLabel: variant.sizeLabel, price: variant.price, compareAtPrice: variant.compareAtPrice },
      }];
    });

  return (
    <div className="content-page page-shell section-pad box-page">
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Build Your Box", url: "/build-your-box" }]} />
      <div className="section-heading content-page-hero" style={{ marginTop: 24 }}>
        <p className="eyebrow with-rule">Buy 2, Get 1 Free</p>
        <h1>Build your box</h1>
      </div>
      <p className="box-intro">Pick any three perfumes. The lowest-priced one is free, and the rest of your bag keeps its offers too.</p>
      <BoxBuilder products={choices} />
    </div>
  );
}
