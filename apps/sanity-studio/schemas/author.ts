import { defineField, defineType } from "sanity";

export default defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" }, validation: (Rule) => Rule.required() }),
    defineField({
      name: "image",
      title: "Photo",
      description: "Recommended: square, at least 400×400px.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "bio", title: "Bio", type: "text", rows: 3 }),
  ],
});
