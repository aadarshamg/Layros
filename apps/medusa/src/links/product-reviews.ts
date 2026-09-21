import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import ReviewsModule from "../modules/reviews";

export default defineLink(
  ProductModule.linkable.product,
  { linkable: ReviewsModule.linkable.review, isList: true },
);
