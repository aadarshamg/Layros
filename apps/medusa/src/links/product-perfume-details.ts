import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import PerfumeDetailsModule from "../modules/perfume-details";

export default defineLink(
  ProductModule.linkable.product,
  PerfumeDetailsModule.linkable.perfumeDetails,
);
