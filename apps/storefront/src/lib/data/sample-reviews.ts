export interface SampleProductReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  isSample: true;
}

const REVIEWERS = ["Aarav", "Meera", "Kabir", "Ananya", "Rohan", "Ishita", "Vihaan", "Naina"];

const OPENINGS = [
  "feels polished from the first spray",
  "opens with a clean, confident character",
  "has an inviting opening that is easy to enjoy",
  "starts bright and settles beautifully",
  "makes a refined first impression",
  "has a distinctive opening without feeling overpowering",
];

const DRY_DOWNS = [
  "The dry-down stays smooth and comfortable for everyday wear.",
  "After a while it becomes softer, balanced, and very wearable.",
  "It settles close to the skin with a warm and elegant finish.",
  "The later stages feel composed and work especially well in the evening.",
  "It develops gradually and leaves a pleasant, memorable trail.",
  "The finish is understated enough for work but still feels special.",
];

const OCCASIONS = [
  "I would reach for this on relaxed evenings and dinners.",
  "It feels versatile enough for both office hours and weekends.",
  "This would be an easy choice when I want something neat and put together.",
  "It suits occasions where a subtle but noticeable scent works best.",
  "I can see this becoming a dependable part of a daily fragrance rotation.",
  "It has the kind of presence that works well for gifting too.",
];

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getSampleReviews(productId: string, productName: string): SampleProductReview[] {
  const seed = hashString(`${productId}:${productName}`);
  return Array.from({ length: 3 }, (_, index) => {
    const localSeed = hashString(`${seed}:${index}`);
    const rating = 3 + (localSeed % 3);
    const reviewer = REVIEWERS[(localSeed >>> 3) % REVIEWERS.length];
    const opening = OPENINGS[(localSeed >>> 7) % OPENINGS.length];
    const dryDown = DRY_DOWNS[(localSeed >>> 11) % DRY_DOWNS.length];
    const occasion = OCCASIONS[(localSeed >>> 15) % OCCASIONS.length];
    return {
      id: `sample-${productId}-${index}`,
      name: reviewer,
      rating,
      comment: `${productName} ${opening}. ${dryDown} ${occasion}`,
      isSample: true,
    };
  });
}

export function summarizeSampleReviews(productId: string, productName: string) {
  const reviews = getSampleReviews(productId, productName);
  return {
    count: reviews.length,
    average: reviews.reduce((total, review) => total + review.rating, 0) / reviews.length,
  };
}
