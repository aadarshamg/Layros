import { defineField, defineType } from "sanity";

export default defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({ name: "orderNumber", title: "Order number", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "paymentMethod",
      title: "Payment method",
      type: "string",
      options: { list: [{ title: "Online (Razorpay)", value: "razorpay" }, { title: "Cash on Delivery", value: "cod" }] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "paymentStatus",
      title: "Payment status",
      type: "string",
      options: { list: [{ title: "Paid", value: "paid" }, { title: "Pending (COD)", value: "pending" }, { title: "Failed", value: "failed" }] },
      initialValue: "pending",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "fulfillmentStatus",
      title: "Fulfillment status",
      type: "string",
      options: { list: ["Unfulfilled", "Processing", "Shipped", "Delivered", "Cancelled"] },
      initialValue: "Unfulfilled",
    }),
    defineField({ name: "razorpayOrderId", title: "Razorpay order ID", type: "string" }),
    defineField({ name: "razorpayPaymentId", title: "Razorpay payment ID", type: "string" }),
    defineField({
      name: "customer",
      title: "Customer account",
      description: "Set only when the order was placed while logged in — guest orders leave this empty.",
      type: "reference",
      to: [{ type: "customer" }],
      weak: true,
    }),
    defineField({ name: "customerEmail", title: "Customer email", type: "string" }),
    defineField({ name: "customerPhone", title: "Customer phone", type: "string" }),
    defineField({
      name: "shippingAddress",
      title: "Shipping address",
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
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [
        {
          type: "object",
          name: "orderItem",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "sku", title: "SKU", type: "string" }),
            defineField({ name: "sizeLabel", title: "Size", type: "string" }),
            defineField({ name: "unitPrice", title: "Unit price (INR)", type: "number" }),
            defineField({ name: "quantity", title: "Quantity", type: "number" }),
          ],
          preview: {
            select: { title: "title", quantity: "quantity", unitPrice: "unitPrice" },
            prepare({ title, quantity, unitPrice }) {
              return { title, subtitle: `× ${quantity} @ ₹${unitPrice}` };
            },
          },
        },
      ],
    }),
    defineField({ name: "subtotalAmount", title: "Subtotal before discount (INR)", type: "number" }),
    defineField({ name: "couponCode", title: "Coupon code used", type: "string" }),
    defineField({ name: "discountAmount", title: "Discount applied (INR)", type: "number" }),
    defineField({ name: "totalAmount", title: "Total (INR)", type: "number", validation: (Rule) => Rule.required().min(0) }),
    defineField({ name: "giftWrapMessage", title: "Gift wrap message", type: "text", rows: 2 }),
  ],
  preview: {
    select: { orderNumber: "orderNumber", status: "paymentStatus", amount: "totalAmount", method: "paymentMethod" },
    prepare({ orderNumber, status, amount, method }) {
      return { title: orderNumber, subtitle: `₹${amount} · ${method} · ${status}` };
    },
  },
});
