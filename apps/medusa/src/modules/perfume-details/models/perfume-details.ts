import { model } from "@medusajs/framework/utils";

export const PerfumeDetails = model.define("perfume_details", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  concentration: model.enum(["EDT", "EDP", "PARFUM"]),
  family: model.enum(["floral", "woody", "oriental", "fresh", "gourmand"]),
  gender: model.enum(["feminine", "masculine", "unisex"]),
  intensity: model.enum(["light", "moderate", "strong"]),
  notes_top: model.array().default([]),
  notes_heart: model.array().default([]),
  notes_base: model.array().default([]),
  perfumer: model.text().nullable(),
  story: model.text().nullable(),
  is_limited: model.boolean().default(false),
  sample_eligible: model.boolean().default(false),
  sample_of_product_id: model.text().nullable(),
});
