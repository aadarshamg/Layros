import { defineField, defineType } from "sanity";

export default defineType({
  name: "shoppableVideo",
  title: "Shoppable Video",
  type: "document",
  fields: [
    defineField({
      name: "videoFile",
      title: "Video",
      description: "Upload directly. Takes priority over the URL field below if both are set. Recommended: portrait/vertical 1080×1920px (9:16), MP4, under 30s, ideally under 20MB.",
      type: "file",
      options: { accept: "video/*" },
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL (legacy)",
      type: "url",
      description: "Only used if no video is uploaded above — an externally hosted video link.",
      validation: (Rule) =>
        Rule.uri({ scheme: ["http", "https"] }).custom((value, context) => {
          const doc = context.document as { videoFile?: unknown } | undefined;
          return value || doc?.videoFile ? true : "Upload a video above, or paste a video URL here.";
        }),
    }),
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      description: "Which product this video sells — its real title, price, and page are used automatically.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "creatorHandle",
      title: "Creator handle",
      type: "string",
      description: 'Shown as attribution over the video, e.g. "@yourhandle". Leave blank to hide.',
    }),
    defineField({
      name: "creatorAvatar",
      title: "Creator avatar",
      type: "image",
      description: "Small profile photo shown next to the handle. Recommended: square, at least 200×200px.",
    }),
    defineField({
      name: "promoBadge",
      title: "Promo badge",
      type: "string",
      description: 'Optional short tag, e.g. "Buy One Get One". Leave blank to hide.',
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers show first in the carousel.",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "product.title", handle: "creatorHandle", media: "creatorAvatar" },
    prepare({ title, handle, media }) {
      return { title: title ?? "(no product linked)", subtitle: handle, media };
    },
  },
});
