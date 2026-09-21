import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { PERFUME_DETAILS_MODULE } from "../perfume-details";
import type PerfumeDetailsModuleService from "../perfume-details/service";

const SAMPLE_CREDIT_CODE = "SAMPLE_CREDIT";

/**
 * Instant sample-to-full-bottle credit (plan §3, chosen over an emailed
 * discount code): if a cart holds a sample line item and the full-size
 * product it samples, deduct the sample's unit price from the full-size
 * line — capped so it never exceeds that line's price, and applied at
 * most once per pairing so re-running this on every cart mutation is safe.
 *
 * Called from the `cart.updated` subscriber (see ../../subscribers/sample-credit.ts).
 * Needs to be exercised against a live cart once Supabase/Medusa are wired up
 * (plan §9, Phase 2 verification) — the line-item-adjustment API surface here
 * is written to the Medusa v2.21 cart module contract but has not been run yet.
 */
export async function applySampleCredit(container: MedusaContainer, cartId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const cartModuleService = container.resolve(Modules.CART);
  const perfumeDetailsService: PerfumeDetailsModuleService = container.resolve(
    PERFUME_DETAILS_MODULE,
  );

  const { data: carts } = await query.graph({
    entity: "cart",
    filters: { id: cartId },
    fields: ["id", "items.id", "items.product_id", "items.unit_price", "items.adjustments.*"],
  });
  const cart = carts[0];
  if (!cart) return;

  // query.graph's remote-query types allow null entries defensively; a cart's
  // own line items never actually come back null.
  const items = (cart.items ?? []).filter((item): item is NonNullable<typeof item> => item != null);

  const productIds = [...new Set(items.map((item) => item.product_id).filter((id): id is string => !!id))];
  if (productIds.length === 0) return;

  const details = await perfumeDetailsService.listPerfumeDetails({
    product_id: productIds,
  });
  const detailsByProductId = new Map(details.map((detail) => [detail.product_id, detail]));

  const adjustmentsToCreate: Array<{
    item_id: string;
    code: string;
    amount: number;
    description: string;
  }> = [];
  const adjustmentIdsToRemove: string[] = [];

  for (const item of items) {
    const existing = (item.adjustments ?? []).find((a) => a?.code === SAMPLE_CREDIT_CODE);

    const sampleItem = items.find((candidate) => {
      const candidateDetails = candidate.product_id
        ? detailsByProductId.get(candidate.product_id)
        : undefined;
      return (
        candidateDetails?.sample_eligible &&
        candidateDetails.sample_of_product_id === item.product_id
      );
    });

    if (!sampleItem) {
      if (existing) adjustmentIdsToRemove.push(existing.id);
      continue;
    }

    const creditAmount = Math.min(sampleItem.unit_price, item.unit_price);
    if (existing && existing.amount === creditAmount) continue;
    if (existing) adjustmentIdsToRemove.push(existing.id);

    adjustmentsToCreate.push({
      item_id: item.id,
      code: SAMPLE_CREDIT_CODE,
      amount: creditAmount,
      description: "Sample cost credited toward full-size bottle",
    });
  }

  if (adjustmentIdsToRemove.length) {
    await cartModuleService.deleteLineItemAdjustments(adjustmentIdsToRemove);
  }
  if (adjustmentsToCreate.length) {
    await cartModuleService.addLineItemAdjustments(adjustmentsToCreate);
  }
}
