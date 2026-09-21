import Image from "next/image";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "The Leyros Story",
  description: "The philosophy, perfumers, and craft behind LEYROS.",
  path: "/story",
});

export default function StoryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "The Leyros Story", url: "/story" }]} />
      <h1 className="mt-6 font-serif text-4xl">The Leyros Story</h1>
      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-sm">
        <Image
          src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600"
          alt="The Leyros atelier"
          fill
          className="object-cover"
        />
      </div>
      <div className="prose prose-neutral mt-8 max-w-none text-charcoal-soft/90">
        <p>
          Leyros began with a simple conviction: that fragrance is not a finishing
          touch, but the first and last thing anyone remembers about a moment.
          Every composition we release is built around a memory worth keeping —
          a place, a person, a season — translated by our perfumers into notes
          that unfold slowly, the way a good story should.
        </p>
        <p>
          We work in small batches with independent perfumers across France and
          India, favouring rare naturals and considered dry-downs over trend
          cycles. Nothing leaves the atelier until it has been worn, revisited,
          and worn again.
        </p>
      </div>
    </div>
  );
}
