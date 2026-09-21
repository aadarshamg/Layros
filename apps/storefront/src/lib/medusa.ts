import Medusa from "@medusajs/js-sdk";

// Falls back to the local dev default rather than throwing, so the storefront
// still boots before Supabase/Medusa are wired up (plan §2) — callers that
// hit the network should expect and handle failures (see lib/data/*).
const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export const medusa = new Medusa({
  baseUrl: backendUrl,
  publishableKey,
});
