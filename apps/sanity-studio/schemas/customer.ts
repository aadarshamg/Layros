import { defineField, defineType } from "sanity";

// _id is always `customer-<E.164 digits, no +>` (e.g. "customer-919876543210")
// — set by the storefront when the document is created, never editable here.
// Same "phone is the identity" pattern as an OTP-based login: there's no
// password, no separate email/username, so the phone number *is* the
// account key, and Sanity's own _id-uniqueness guarantee is what prevents
// duplicate accounts for the same number.
export default defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  fields: [
    defineField({
      name: "phone",
      title: "Phone",
      description: "10-digit Indian mobile number, no country code, no leading +91.",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required().regex(/^[6-9]\d{9}$/, { name: "10-digit Indian mobile" }),
    }),
    defineField({ name: "name", title: "Name", type: "string" }),
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({
      name: "defaultShippingAddress",
      title: "Default shipping address",
      type: "object",
      fields: [
        defineField({ name: "fullName", title: "Full name", type: "string" }),
        defineField({ name: "addressLine1", title: "Address line 1", type: "string" }),
        defineField({ name: "addressLine2", title: "Address line 2", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "postalCode", title: "PIN code", type: "string" }),
        defineField({ name: "country", title: "Country", type: "string", initialValue: "IN" }),
      ],
    }),
    defineField({ name: "marketingOptIn", title: "Marketing opt-in", type: "boolean", initialValue: false }),
    defineField({
      name: "tokenVersion",
      title: "Token version",
      description: 'Internal — bumped by "log out everywhere" to invalidate all existing sessions for this customer. Not for manual editing.',
      type: "number",
      readOnly: true,
      initialValue: 0,
    }),
    defineField({ name: "createdAt", title: "Created at", type: "datetime", readOnly: true }),
    defineField({ name: "lastLoginAt", title: "Last login at", type: "datetime", readOnly: true }),
  ],
  preview: {
    select: { name: "name", phone: "phone" },
    prepare({ name, phone }) {
      return { title: name || phone, subtitle: name ? phone : undefined };
    },
  },
});
