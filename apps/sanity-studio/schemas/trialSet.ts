import { defineField, defineType } from "sanity";

export default defineType({
  name: "trialSet",
  title: "Trial Set",
  type: "document",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'Short tile name shown under the image, e.g. "For Him", "For Her", "Oud Unisex".',
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      description: "The trial/discovery set this tile sells. Its 10ml size (or cheapest size) is what gets added to the cart, at its real price.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Tile image",
      type: "image",
      options: { hotspot: true },
      description: "Optional — defaults to the product's first photo. Recommended: square, at least 1000×1000px.",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: 'Optional small line under the label, e.g. "Five bestsellers to try". Leave blank to show the set size and price only.',
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers show first.",
      initialValue: 0,
    }),
  ],
  orderings: [{ title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "label", subtitle: "product.title", media: "image", productMedia: "product.images.0" },
    prepare({ title, subtitle, media, productMedia }) {
      return { title: title ?? "(no label)", subtitle: subtitle ?? "(no product linked)", media: media ?? productMedia };
    },
  },
});
