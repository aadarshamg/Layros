import { GoogleGIcon, StarIcon } from "@/components/layout/FooterIcons";
import type { GoogleReviewHighlight } from "@/lib/data/store-settings";

function ReviewStars({ value }: { value: number }) {
  return (
    <span className="google-review-stars" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => <StarIcon key={index} filled={index < Math.round(value)} />)}
    </span>
  );
}

export function GoogleReviewsSection({
  rating,
  reviewCount,
  reviewsUrl,
  reviews = [],
}: {
  rating?: number;
  reviewCount?: number;
  reviewsUrl?: string;
  reviews?: GoogleReviewHighlight[];
}) {
  const href = reviewsUrl || `https://www.google.com/search?q=${encodeURIComponent("Leyros perfume Ludhiana reviews")}`;
  const hasAggregateRating = typeof rating === "number" && typeof reviewCount === "number";

  return (
    <section className="google-reviews-section" aria-labelledby="google-reviews-title">
      <div className="cinematic-shell google-reviews-shell">
        <div className="google-reviews-summary">
          <span className="google-reviews-google-mark"><GoogleGIcon /></span>
          <p>Trusted by fragrance lovers</p>
          <h2 id="google-reviews-title">Customer stories, shared on Google</h2>
          <span className="google-reviews-intro">
            Read genuine feedback from customers who have experienced Leyros fragrances, attars,
            candles, and gifting.
          </span>

          {hasAggregateRating && (
            <div className="google-reviews-score" aria-label={`${rating.toFixed(1)} out of 5 from ${reviewCount} Google reviews`}>
              <strong>{rating.toFixed(1)}</strong>
              <div>
                <ReviewStars value={rating} />
                <span>Based on {reviewCount} Google {reviewCount === 1 ? "review" : "reviews"}</span>
              </div>
            </div>
          )}

          <a className="google-reviews-cta" href={href} target="_blank" rel="noreferrer">
            View reviews on Google <span aria-hidden="true">↗</span>
          </a>
        </div>

        {reviews.length > 0 ? (
          <div className="google-reviews-grid">
            {reviews.slice(0, 6).map((review, index) => (
              <article className="google-review-card" key={`${review.reviewerName}-${index}`}>
                <div className="google-review-card-head">
                  <span className="google-review-avatar" aria-hidden="true">
                    {review.reviewerName.trim().charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3>{review.reviewerName}</h3>
                    <span>Posted on Google</span>
                  </div>
                  <GoogleGIcon />
                </div>
                <ReviewStars value={review.rating} />
                <blockquote>“{review.reviewText}”</blockquote>
                {review.reviewDate && <time dateTime={review.reviewDate}>{new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(review.reviewDate))}</time>}
                {review.reviewUrl && (
                  <a href={review.reviewUrl} target="_blank" rel="noreferrer" aria-label={`Read ${review.reviewerName}'s review on Google`}>
                    View original <span aria-hidden="true">↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="google-reviews-live-card">
            <GoogleGIcon />
            <h3>Verified feedback lives on Google</h3>
            <p>Open the Leyros Google profile to read the latest customer experiences directly from the source.</p>
            <a href={href} target="_blank" rel="noreferrer">Read genuine reviews <span aria-hidden="true">↗</span></a>
          </div>
        )}
      </div>
    </section>
  );
}
