import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PERFUME_DETAILS_MODULE } from "../../../modules/perfume-details";
import type PerfumeDetailsModuleService from "../../../modules/perfume-details/service";

/** GET /admin/perfume-details?product_id=prod_123 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.query.product_id;
  if (typeof productId !== "string") {
    res.status(400).json({ message: "product_id is required" });
    return;
  }

  const perfumeDetailsService: PerfumeDetailsModuleService = req.scope.resolve(
    PERFUME_DETAILS_MODULE,
  );
  const [details] = await perfumeDetailsService.listPerfumeDetails({ product_id: productId });
  res.json({ perfume_details: details ?? null });
}

interface PerfumeDetailsBody {
  product_id: string;
  concentration: "EDT" | "EDP" | "PARFUM";
  family: "floral" | "woody" | "oriental" | "fresh" | "gourmand";
  gender: "feminine" | "masculine" | "unisex";
  intensity: "light" | "moderate" | "strong";
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
  perfumer?: string;
  story?: string;
  is_limited: boolean;
  sample_eligible: boolean;
  sample_of_product_id?: string;
}

/** POST /admin/perfume-details — create-or-update, keyed by product_id. */
export async function POST(
  req: MedusaRequest<PerfumeDetailsBody>,
  res: MedusaResponse,
) {
  const body = req.body;
  if (!body?.product_id) {
    res.status(400).json({ message: "product_id is required" });
    return;
  }

  const perfumeDetailsService: PerfumeDetailsModuleService = req.scope.resolve(
    PERFUME_DETAILS_MODULE,
  );
  const [existing] = await perfumeDetailsService.listPerfumeDetails({
    product_id: body.product_id,
  });

  const details = existing
    ? (await perfumeDetailsService.updatePerfumeDetails([{ id: existing.id, ...body }]))[0]
    : (await perfumeDetailsService.createPerfumeDetails([body]))[0];

  res.json({ perfume_details: details });
}
