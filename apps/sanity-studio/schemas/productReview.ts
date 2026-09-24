import { defineField, defineType } from "sanity";

// Submitted by shoppers from the product page (POST /api/reviews). Nothing
// shows on the site until an admin ticks "Approved".
export default defineType({
  name: "productReview",
  title: "Product Review",
  type: "document",
  fields: [
    defineField({
      name: "approved",
      title: "Approved",
      type: "boolean",
      description: "Only approved reviews appear on the site and count toward the product's rating.",
      initialValue: false,
    }),
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "name", title: "Reviewer name", type: "string", validation: (Rule) => Rule.required().max(60) }),
    defineField({
      name: "rating",
      title: "Rating (1–5)",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1).max(5),
    }),
    defineField({ name: "comment", title: "Review", type: "text", rows: 4, validation: (Rule) => Rule.max(1000) }),
    defineField({ name: "submittedAt", title: "Submitted", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "Newest first", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", rating: "rating", product: "product.title", approved: "approved", media: "product.images.0" },
    prepare({ name, rating, product, approved, media }) {
      const stars = "★".repeat(Math.max(0, Math.min(5, rating ?? 0)));
      return { title: `${approved ? "" : "⏳ Pending · "}${name ?? "Anonymous"} ${stars}`, subtitle: product, media };
    },
  },
});
