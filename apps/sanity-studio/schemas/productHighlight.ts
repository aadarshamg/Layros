import { defineField, defineType } from "sanity";

// A reusable "when/where to wear it" label (Daily Wear, Office Wear, Long
// Lasting…). Create the label once here, then pick it on any product.
export default defineType({
  name: "productHighlight",
  title: "Product Highlight",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Label",
      type: "string",
      description: 'Short, 1–3 words, e.g. "Daily Wear", "Special Occasion", "Long Lasting".',
      validation: (Rule) => Rule.required().max(24),
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Optional single emoji shown before the label, e.g. ☀️ 💼 🌙 ⏳. Leave blank for a simple ✦.",
      validation: (Rule) => Rule.max(4),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers rotate first when a product has several highlights.",
      initialValue: 0,
    }),
  ],
  orderings: [{ title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", icon: "icon" },
    prepare({ title, icon }) {
      return { title: `${icon || "✦"} ${title ?? ""}` };
    },
  },
});
