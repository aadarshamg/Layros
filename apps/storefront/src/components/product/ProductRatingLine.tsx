import Link from "next/link";

// Real ratings only: the Amazon listing's rating (entered in admin) when set,
// otherwise approved reviews from this site, otherwise an invite to review.
export function ProductRatingLine({
  handle,
  count,
  average,
  amazonRating,
  amazonRatingCount,
  amazonUrl,
}: {
  handle: string;
  count?: number;
  average?: number;
  amazonRating?: number;
  amazonRatingCount?: number;
  amazonUrl?: string;
}) {
  const reviewsHref = `/products/${handle}#reviews`;
  if (amazonRating && amazonRatingCount) {
    const label = `Rated ${amazonRating.toFixed(1)} out of 5 from ${amazonRatingCount} ratings on Amazon`;
    const body = (
      <>
        <span className="product-rating-star" aria-hidden="true">★</span>
        <b>{amazonRating.toFixed(1)}</b>
        <span className="product-rating-divider" aria-hidden="true">|</span>
        ({amazonRatingCount.toLocaleString("en-IN")} ratings on Amazon)
      </>
    );
    return amazonUrl ? (
      <a href={amazonUrl} target="_blank" rel="noopener noreferrer" className="product-rating" aria-label={label}>{body}</a>
    ) : (
      <span className="product-rating" aria-label={label}>{body}</span>
    );
  }
  if (!count || !average) {
    return (
      <Link href={reviewsHref} className="product-rating is-empty">
        <span aria-hidden="true">☆</span> Be the first to review
      </Link>
    );
  }
  return (
    <Link href={reviewsHref} className="product-rating" aria-label={`Rated ${average.toFixed(1)} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}`}>
      <span className="product-rating-star" aria-hidden="true">★</span>
      <b>{average.toFixed(1)}</b>
      <span className="product-rating-divider" aria-hidden="true">|</span>
      ({count} {count === 1 ? "Review" : "Reviews"})
    </Link>
  );
}
