import { model } from "@medusajs/framework/utils";

export const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  customer_id: model.text(),
  rating: model.number(),
  title: model.text().nullable(),
  body: model.text(),
  verified_purchase: model.boolean().default(false),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
});
