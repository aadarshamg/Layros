import { getApprovedReviews } from "@/lib/data/reviews";
import { ReviewForm } from "@/components/product/ReviewForm";

function Stars({ value }: { value: number }) {
  return (
    <span className="review-stars" aria-hidden="true">
      <span className="review-stars-base">★★★★★</span>
      <span className="review-stars-fill" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }}>★★★★★</span>
    </span>
  );
}

export async function ProductReviews({ productId, productName, count, average }: { productId: string; productName: string; count?: number; average?: number }) {
  // Only approved reviews from real shoppers.
  const visibleReviews = await getApprovedReviews(productId);
  const visibleCount = count;
  const visibleAverage = average;

  return (
    <section className="product-reviews" id="reviews" aria-labelledby="product-reviews-heading">
      <div className="page-shell">
        <div className="product-reviews-head">
          <div>
            <h2 id="product-reviews-heading">Reviews</h2>
            {visibleCount && visibleAverage ? (
              <p className="product-reviews-summary">
                <Stars value={visibleAverage} />
                <b>{visibleAverage.toFixed(1)}</b> out of 5 · {visibleCount} {visibleCount === 1 ? "review" : "reviews"}
              </p>
            ) : (
              <p className="product-reviews-summary is-empty">No reviews yet. Be the first to share how it wears.</p>
            )}
          </div>
          <ReviewForm productId={productId} />
        </div>
        {visibleReviews.length > 0 && (
          <ul className="product-review-list">
            {visibleReviews.map((review) => (
              <li key={review.id} className="product-review">
                <Stars value={review.rating} />
                <p className="product-review-meta">
                  <b>{review.name}</b>
                  {review.submittedAt && (
                    <time dateTime={review.submittedAt}>
                      {new Date(review.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </time>
                  )}
                </p>
                {review.comment && <p className="product-review-comment">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
