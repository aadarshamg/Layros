import Image from "next/image";
import Link from "next/link";
import { getTrialSets } from "@/lib/data/trial-sets";
import { formatInr, formatSize } from "@/lib/format";
import { TrialSetAddButton } from "@/components/home/TrialSetAddButton";
import { DEFAULT_TRIAL_SECTION_TITLE } from "@/lib/site-defaults";

export async function TrialSetShowcase({ title, subtitle }: { title?: string; subtitle?: string }) {
  const sets = await getTrialSets();
  if (sets.length === 0) return null;

  return (
    <section className="trial-sets" aria-labelledby="trial-sets-title">
      <div className="cinematic-shell">
        <header className="trial-sets-heading">
          <h2 id="trial-sets-title">{title || DEFAULT_TRIAL_SECTION_TITLE}</h2>
          {subtitle && <p>{subtitle}</p>}
        </header>
        <div className="trial-sets-grid">
          {sets.map((set) => {
            const { product } = set;
            const variant =
              product.variants.find((v) => v.sizeMl === 10) ??
              [...product.variants].sort((a, b) => a.price - b.price)[0];
            return (
              <article className="trial-set" key={set.id}>
                <Link href={`/products/${product.handle}`} className="trial-set-image">
                  {set.image && <Image src={set.image} alt={product.title} fill sizes="(max-width: 700px) 70vw, 25vw" />}
                </Link>
                <h3>{set.label}</h3>
                <p className="trial-set-meta">
                  {set.tagline || formatSize(variant.sizeMl, variant.sizeLabel)} · <b>{formatInr(variant.price)}</b>
                  {variant.compareAtPrice && variant.compareAtPrice > variant.price && <s>{formatInr(variant.compareAtPrice)}</s>}
                </p>
                <TrialSetAddButton
                  productId={product.id}
                  handle={product.handle}
                  title={product.title}
                  image={product.images[0]}
                  variant={variant}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
