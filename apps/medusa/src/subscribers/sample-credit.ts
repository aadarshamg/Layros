import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { applySampleCredit } from "../modules/sample-credit/apply-sample-credit";

export default async function sampleCreditHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await applySampleCredit(container, data.id);
}

export const config: SubscriberConfig = {
  event: "cart.updated",
};
