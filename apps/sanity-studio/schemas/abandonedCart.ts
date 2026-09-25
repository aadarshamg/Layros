import { defineField, defineType } from "sanity";

// One document per phone number (deterministic id), written by the storefront
// whenever a shopper whose phone is known changes their cart. The reminder job
// (/api/cron/abandoned-carts) reads and updates it — mostly read-only here.
export default defineType({
  name: "abandonedCart",
  title: "Abandoned Cart",
  type: "document",
  fields: [
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Waiting (cart not bought yet)", value: "active" },
          { title: "Recovered (order placed)", value: "converted" },
          { title: "Emptied by shopper", value: "empty" },
          { title: "Opted out — never message", value: "optedOut" },
          { title: "Expired (older than 7 days)", value: "expired" },
        ],
        layout: "radio",
      },
      description: 'Set to "Opted out" if this person asks not to be messaged — they will never get a reminder again.',
      initialValue: "active",
    }),
    defineField({ name: "phone", title: "Phone", type: "string", readOnly: true }),
    defineField({ name: "name", title: "Name", type: "string", readOnly: true }),
    defineField({
      name: "consent",
      title: "Agreed to WhatsApp messages",
      type: "boolean",
      readOnly: true,
      description: "Ticked the WhatsApp updates box at checkout. Carts without consent are never messaged.",
    }),
    defineField({ name: "source", title: "Captured from", type: "string", readOnly: true, description: "login = verified by OTP · guest = typed at the address step" }),
    defineField({
      name: "items",
      title: "Cart items",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          name: "cartItem",
          fields: [
            defineField({ name: "title", type: "string" }),
            defineField({ name: "sizeLabel", title: "Size", type: "string" }),
            defineField({ name: "quantity", type: "number" }),
            defineField({ name: "unitPrice", title: "Unit price (INR)", type: "number" }),
            defineField({ name: "productId", type: "string", hidden: true }),
            defineField({ name: "variantId", type: "string", hidden: true }),
            defineField({ name: "handle", type: "string", hidden: true }),
          ],
          preview: {
            select: { title: "title", size: "sizeLabel", quantity: "quantity", price: "unitPrice" },
            prepare({ title, size, quantity, price }) {
              return { title: `${quantity ?? 1} × ${title}`, subtitle: [size, price != null ? `₹${price}` : null].filter(Boolean).join(" · ") };
            },
          },
        },
      ],
    }),
    defineField({ name: "cartTotal", title: "Cart total (INR)", type: "number", readOnly: true }),
    defineField({ name: "updatedAt", title: "Cart last changed", type: "datetime", readOnly: true }),
    defineField({ name: "remindersSent", title: "Reminders sent", type: "number", readOnly: true, initialValue: 0 }),
    defineField({ name: "lastRemindedAt", title: "Last reminder", type: "datetime", readOnly: true }),
    defineField({ name: "lastReminderResult", title: "Last reminder result", type: "string", readOnly: true }),
    defineField({ name: "restoredAt", title: "Opened the reminder link", type: "datetime", readOnly: true }),
    defineField({ name: "convertedOrderNumber", title: "Recovered order", type: "string", readOnly: true }),
    defineField({ name: "restoreToken", title: "Restore token", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "itemsSignature", title: "Items signature", type: "string", readOnly: true, hidden: true }),
  ],
  orderings: [{ title: "Recently changed", name: "updatedDesc", by: [{ field: "updatedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", phone: "phone", status: "status", total: "cartTotal", reminders: "remindersSent" },
    prepare({ name, phone, status, total, reminders }) {
      const label: Record<string, string> = { active: "Waiting", converted: "Recovered", empty: "Emptied", optedOut: "Opted out", expired: "Expired" };
      return {
        title: `${name || "Shopper"} · +91 ${phone ?? ""}`,
        subtitle: `${label[status as string] ?? status}${total != null ? ` · ₹${total}` : ""} · ${reminders ?? 0} reminder(s) sent`,
      };
    },
  },
});
