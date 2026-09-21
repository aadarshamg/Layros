import Link from "next/link";
import Image from "next/image";
import type { PerfumeProduct } from "@leyros/types";
import { formatInr } from "@/lib/format";

export function ProductCard({ product }: { product: PerfumeProduct }) {
  const cheapestVariant = [...product.variants].sort((a, b) => a.price - b.price)[0];
  const notes = [product.details.notesTop[0], product.details.notesHeart[0], product.details.notesBase[0]].filter(Boolean);

  return (
    <Link href={`/products/${product.handle}`} className="product-card">
      <div className="product-card-image">
        {product.images[0] && <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 700px) 50vw, 33vw" />}
        <span className="product-card-badge">{product.tags[0] || "Extrait de Parfum"}</span>
      </div>
      <h3>{product.title}{cheapestVariant && <span>{formatInr(cheapestVariant.price)}</span>}</h3>
      <p className="product-notes">{product.description}</p>
      <div className="product-meta">
        <span>{product.details.family}</span>
        {notes.map((note) => <span key={note}>{note}</span>)}
      </div>
    </Link>
  );
}
