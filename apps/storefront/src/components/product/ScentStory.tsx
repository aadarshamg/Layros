import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { genderLabel } from "@/lib/product-labels";
import { getScentStoryTheme, scentNoteImage, scentStoryNarrative } from "@/lib/scent-story";

type ScentStoryProps = {
  product: PerfumeProduct;
  name: string;
};

export function ScentStory({ product, name }: ScentStoryProps) {
  const { details } = product;
  const theme = getScentStoryTheme(product);
  const productImage = product.images[1] ?? product.images[0] ?? "/leyros/nuit-doree-hero.jpg";
  const chapters = [
    { eyebrow: "The opening", title: "First light", notes: details.notesTop, fallback: "/leyros/fleur-oranger.jpg" },
    { eyebrow: "The heart", title: "The story unfolds", notes: details.notesHeart, fallback: "/leyros/rose.jpg" },
    { eyebrow: "The trail", title: "What remains", notes: details.notesBase, fallback: "/leyros/sandalwood.jpg" },
  ];

  return (
    <section className="scent-story" aria-labelledby="scent-story-title">
      <div className="page-shell scent-story-stage">
        <div className="scent-story-visual">
          <Image src={productImage} alt={`${name} fragrance story`} fill sizes="(max-width: 760px) 100vw, 50vw" />
          <div className="scent-story-shade" />
          <span className="scent-story-mark">#ScentStory</span>
          <p>{theme.mood}</p>
        </div>
        <div className="scent-story-intro">
          <span>Chapter one · {details.family}</span>
          <p className="scent-story-kicker">{theme.chapter}</p>
          <h2 id="scent-story-title">The story of {name}</h2>
          <p>{scentStoryNarrative(product, name)}</p>
          <blockquote>“A fragrance should not simply be noticed. It should take you somewhere.”</blockquote>
          <small>Leyros Atelier</small>
        </div>
      </div>

      <div className="page-shell scent-story-chapters">
        {chapters.map((chapter) => (
          <article key={chapter.eyebrow}>
            <div className="scent-story-note-image">
              <Image
                src={scentNoteImage(chapter.notes, chapter.fallback)}
                alt={`${chapter.notes.join(", ") || chapter.title} fragrance notes`}
                fill
                sizes="(max-width: 760px) 100vw, 33vw"
              />
            </div>
            <div>
              <span>{chapter.eyebrow}</span>
              <h3>{chapter.title}</h3>
              <p>{chapter.notes.length ? chapter.notes.join(" · ") : "A composed Leyros accord"}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="page-shell scent-story-profile">
        <div>
          <span>The scent in one breath</span>
          <h2>{theme.mood.replaceAll(" · ", ". ")}.</h2>
          <p>Best worn for {theme.ritual.toLowerCase()}.</p>
        </div>
        <dl>
          <div><dt>Family</dt><dd>{details.family}</dd></div>
          <div><dt>Character</dt><dd>{details.intensity}</dd></div>
          <div><dt>For</dt><dd>{genderLabel(product) ?? "Unisex"}</dd></div>
          <div><dt>Concentration</dt><dd>30% perfume oil</dd></div>
        </dl>
      </div>
    </section>
  );
}
