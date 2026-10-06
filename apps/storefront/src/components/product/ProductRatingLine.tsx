import Link from "next/link";

export function ProductRatingLine({ handle, count, average, isSample = false }: { handle: string; count?: number; average?: number; isSample?: boolean }) {
  const href = `/products/${handle}#reviews`;
  if (!count || !average) {
    return (
      <Link href={href} className="product-rating is-empty">
        <span aria-hidden="true">☆</span> Be the first to review
      </Link>
    );
  }
  return (
    <Link href={href} className="product-rating" aria-label={`${isSample ? "Sample rating" : "Rated"} ${average.toFixed(1)} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}`}>
      <span className="product-rating-star" aria-hidden="true">★</span>
      <b>{average.toFixed(1)}</b>
      <span className="product-rating-divider" aria-hidden="true">|</span>
      ({count} {isSample ? "Sample Reviews" : count === 1 ? "Review" : "Reviews"})
    </Link>
  );
}
