import { GoogleGIcon, StarIcon } from "@/components/layout/FooterIcons";
import type { GoogleReviewHighlight } from "@/lib/data/store-settings";

const VERIFIED_LEYROS_REVIEWS: GoogleReviewHighlight[] = [
  { reviewerName: "Lovish Kalra", rating: 5, reviewText: "Blue Mystique perfume is very good quality.", reviewDate: "2025-10-13" },
  { reviewerName: "Surjit Singh", rating: 5, reviewText: "Amazing perfume and candles. I love these products.", reviewDate: "2025-10-13" },
  { reviewerName: "Rahul Verma", rating: 5, reviewText: "Loved the perfume's long-lasting scent.", reviewDate: "2025-10-13" },
  { reviewerName: "Moni Pokhriyal", rating: 5, reviewText: "Best quality.", reviewDate: "2025-10-30" },
  { reviewerName: "Deep Atwal", rating: 5, reviewText: "Very nice perfume.", reviewDate: "2025-10-13" },
];

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
  const displayRating = rating ?? 5;
  const displayReviewCount = reviewCount ?? 47;
  const visibleReviews = reviews.length > 0 ? reviews : VERIFIED_LEYROS_REVIEWS;

  return (
    <section className="google-reviews-section" aria-labelledby="google-reviews-title">
      <div className="cinematic-shell google-reviews-shell">
        <div className="google-reviews-summary">
          <span className="google-reviews-google-mark"><GoogleGIcon /></span>
          <p>From the Leyros community</p>
          <h2 id="google-reviews-title">Scent stories, shared on Google</h2>

          <div className="google-reviews-score" aria-label={`${displayRating.toFixed(1)} out of 5 from ${displayReviewCount} Google reviews`}>
            <strong>{displayRating.toFixed(1)}</strong>
            <div>
              <ReviewStars value={displayRating} />
              <span>Based on {displayReviewCount} Google {displayReviewCount === 1 ? "review" : "reviews"}</span>
            </div>
          </div>

          <a className="google-reviews-cta" href={href} target="_blank" rel="noreferrer">
            View reviews on Google <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="google-reviews-grid" aria-label="Customer reviews from Google">
          {visibleReviews.slice(0, 6).map((review, index) => (
            <article className="google-review-card" key={`${review.reviewerName}-${index}`}>
              <span className="google-review-quote" aria-hidden="true">“</span>
              <blockquote>{review.reviewText}</blockquote>
              <ReviewStars value={review.rating} />
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
              {review.reviewDate && (
                <time dateTime={review.reviewDate}>
                  {new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(review.reviewDate))}
                </time>
              )}
              {review.reviewUrl && (
                <a href={review.reviewUrl} target="_blank" rel="noreferrer" aria-label={`Read ${review.reviewerName}'s review on Google`}>
                  View original <span aria-hidden="true">↗</span>
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
