import { defineField, defineType } from "sanity";

export default defineType({
  name: "coupon",
  title: "Coupon",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "string",
      description: 'What customers type, e.g. "WELCOME10". Stored and matched in uppercase.',
      validation: (Rule) => Rule.required().uppercase(),
    }),
    defineField({
      name: "discountType",
      title: "Discount type",
      type: "string",
      options: { list: [{ title: "Percent off", value: "percent" }, { title: "Flat amount off (INR)", value: "flat" }] },
      initialValue: "percent",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "discountValue",
      title: "Discount value",
      description: "A percent (e.g. 10 for 10%) or a flat INR amount, depending on Discount type above.",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "minOrderAmount",
      title: "Minimum order amount (INR)",
      description: "Optional — cart subtotal must be at least this for the code to apply.",
      type: "number",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({ name: "active", title: "Active", type: "boolean", initialValue: true }),
    defineField({
      name: "expiresAt",
      title: "Expires at",
      description: "Optional — leave blank for no expiry.",
      type: "datetime",
    }),
  ],
  preview: {
    select: { code: "code", type: "discountType", value: "discountValue", active: "active" },
    prepare({ code, type, value, active }) {
      const amount = type === "percent" ? `${value}% off` : `₹${value} off`;
      return { title: code, subtitle: `${amount}${active ? "" : " · inactive"}` };
    },
  },
});
