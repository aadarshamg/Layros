import { defineField, defineType } from "sanity";

const FRAGRANCE_FAMILIES = ["floral", "woody", "oriental", "fresh", "gourmand"] as const;
const GENDERS = ["feminine", "masculine", "unisex"] as const;
const INTENSITIES = ["light", "moderate", "strong"] as const;
const CONCENTRATIONS = ["EDT", "EDP", "PARFUM"] as const;

export default defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Used in the product URL, e.g. /products/nuit-doree",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "brand", title: "Brand", type: "string", initialValue: "Leyros" }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "images",
      title: "Images & video",
      description:
        'Drag the ⠿ handle to reorder — first photo is the main image. Click "+" to add either a photo or a video; at most one video per product. Photos: square, at least 1200×1200px, JPG/PNG/WebP. Video: at least 1080px on the short side, MP4, ideally under 20MB.',
      type: "array",
      of: [
        { type: "image", options: { hotspot: true } },
        { type: "file", name: "video", title: "Video", options: { accept: "video/*" } },
      ],
      validation: (Rule) =>
        Rule.min(1)
          .error("Add at least one product photo.")
          .custom((items) => {
            const videoCount = (items ?? []).filter((item): item is { _type: string } => (item as { _type?: string })?._type === "video").length;
            return videoCount <= 1 ? true : "Only one video is supported per product — remove the extra one.";
          }),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: 'Real merchandising category, e.g. "Men Perfumes", "Fragrance Candles", "Car Perfumes".',
    }),
    defineField({
      name: "videoFile",
      title: "Product video (legacy)",
      description:
        "Superseded by adding a video directly in Images & video above — kept only so products already using this field keep working. New uploads should go in the gallery instead.",
      type: "file",
      options: { accept: "video/*" },
    }),
    defineField({
      name: "videoUrl",
      title: "Product video URL (legacy)",
      type: "url",
      description: "Only used if no video is set above — an externally hosted video link.",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      description: 'e.g. "Bestseller", "Limited Harvest" — used for merchandising, not filtering.',
      options: { layout: "tags" },
    }),
    defineField({
      name: "variants",
      title: "Variants (bottle sizes)",
      type: "array",
      validation: (Rule) => Rule.min(1).error("Add at least one size/variant."),
      of: [
        {
          type: "object",
          name: "variant",
          fields: [
            defineField({
              name: "sizeMl",
              title: "Size (ml)",
              description: "For non-ml products (candles, gift sets), a best-effort number — the Size label below is what actually displays.",
              type: "number",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "sizeLabel",
              title: "Size label",
              description: 'Free text shown instead of "Xml", e.g. "645g Thali", "10ml x 5". Leave blank for a plain perfume bottle to just show "Xml".',
              type: "string",
            }),
            defineField({ name: "sku", title: "SKU", type: "string", validation: (Rule) => Rule.required() }),
            defineField({
              name: "price",
              title: "Price (INR)",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: "compareAtPrice",
              title: "Compare-at price (INR)",
              description: "Optional — set this to show a struck-through original price and a discount badge.",
              type: "number",
              validation: (Rule) => Rule.min(0),
            }),
            defineField({
              name: "inventoryQuantity",
              title: "Stock on hand",
              type: "number",
              initialValue: 0,
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: { sizeMl: "sizeMl", price: "price", sku: "sku" },
            prepare({ sizeMl, price, sku }) {
              return { title: `${sizeMl}ml — ₹${price}`, subtitle: sku };
            },
          },
        },
      ],
    }),
    defineField({
      name: "details",
      title: "Perfume details",
      type: "object",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "concentration",
          title: "Concentration",
          description: "Perfumes only — leave at default for candles/other non-perfume items.",
          type: "string",
          options: { list: [...CONCENTRATIONS] },
          initialValue: "EDP",
        }),
        defineField({
          name: "family",
          title: "Fragrance family",
          description: "Perfumes only — leave at default for candles/other non-perfume items.",
          type: "string",
          options: { list: [...FRAGRANCE_FAMILIES] },
          initialValue: "fresh",
        }),
        defineField({
          name: "gender",
          title: "Gender",
          type: "string",
          options: { list: [...GENDERS] },
          initialValue: "unisex",
        }),
        defineField({
          name: "intensity",
          title: "Intensity",
          description: "Perfumes only — leave at default for candles/other non-perfume items.",
          type: "string",
          options: { list: [...INTENSITIES] },
          initialValue: "moderate",
        }),
        defineField({ name: "notesTop", title: "Top notes", type: "array", of: [{ type: "string" }] }),
        defineField({ name: "notesHeart", title: "Heart notes", type: "array", of: [{ type: "string" }] }),
        defineField({ name: "notesBase", title: "Base notes", type: "array", of: [{ type: "string" }] }),
        defineField({ name: "perfumer", title: "Perfumer", type: "string" }),
        defineField({ name: "story", title: "Story", type: "text", rows: 4 }),
        defineField({ name: "isLimited", title: "Limited edition", type: "boolean", initialValue: false }),
        defineField({ name: "sampleEligible", title: "Sample eligible", type: "boolean", initialValue: false }),
        defineField({
          name: "sampleOfProduct",
          title: "Sample of (full-size product)",
          type: "reference",
          to: [{ type: "product" }],
          description: "Only set this on a product that IS a sample listing.",
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "images.0", family: "details.family" },
    prepare({ title, media, family }) {
      return { title, subtitle: family, media };
    },
  },
});
