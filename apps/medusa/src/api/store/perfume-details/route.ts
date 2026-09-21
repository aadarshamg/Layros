import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PERFUME_DETAILS_MODULE } from "../../../modules/perfume-details";
import type PerfumeDetailsModuleService from "../../../modules/perfume-details/service";

/**
 * Returns perfume-details rows keyed by product_id for the given product
 * ids — e.g. GET /store/perfume-details?product_id[]=prod_1&product_id[]=prod_2
 *
 * Exists because the product<->perfumeDetails module link (see
 * src/links/product-perfume-details.ts) only resolves remote-query joins
 * in the perfume_details -> product direction, not product -> perfumeDetails
 * (a Medusa v2 quirk when a core module is the link's first argument) — this
 * route sidesteps that by querying the module service directly instead.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const raw = req.query.product_id;
  const productIds = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (productIds.length === 0) {
    res.json({ perfume_details: [] });
    return;
  }

  const perfumeDetailsService: PerfumeDetailsModuleService = req.scope.resolve(
    PERFUME_DETAILS_MODULE,
  );
  const perfumeDetails = await perfumeDetailsService.listPerfumeDetails({
    product_id: productIds as string[],
  });

  res.json({ perfume_details: perfumeDetails });
}
