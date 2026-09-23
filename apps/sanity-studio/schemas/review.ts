import { defineField, defineType } from "sanity";

// Populated by scripts/sync-google-reviews.mjs — not meant to be hand-authored,
// though any field can be edited/removed here if a review needs hiding.
// Deterministic _id (review-<google-review-id>) means re-running the sync is
// a safe upsert, never a duplicate.
export default defineType({
  name: "review",
  title: "Google Review",
  type: "document",
  fields: [
    defineField({ name: "authorName", title: "Author name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "authorPhotoUrl", title: "Author photo URL", type: "url" }),
    defineField({ name: "authorProfileUrl", title: "Author Google profile URL", type: "url" }),
    defineField({ name: "rating", title: "Rating (1-5)", type: "number", validation: (Rule) => Rule.required().min(1).max(5) }),
    defineField({ name: "text", title: "Review text", type: "text", rows: 4, validation: (Rule) => Rule.required() }),
    defineField({ name: "relativeTime", title: "Relative time (as shown by Google)", description: 'e.g. "2 months ago" — text as provided by Google, not recomputed.', type: "string" }),
    defineField({ name: "publishTime", title: "Published at", type: "datetime" }),
    defineField({ name: "syncedAt", title: "Last synced at", type: "datetime", readOnly: true }),
  ],
  preview: {
    select: { title: "authorName", rating: "rating", text: "text" },
    prepare({ title, rating, text }) {
      return { title: `${title} — ${"★".repeat(rating ?? 0)}${"☆".repeat(5 - (rating ?? 0))}`, subtitle: text };
    },
  },
});
