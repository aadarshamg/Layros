import "server-only";

/**
 * Low-stock WhatsApp alert to the shop owner, through the same WaSarathi /
 * BotSailor panel as the login OTP. In the panel, get a Utility template
 * approved, e.g.
 *
 *   "Low stock alert: {{1}} has only {{2}} left. Please refill."
 *
 * then API Developer → Generate API End-point → "Send Template Message (GET)"
 * with that template and YOUR number as the recipient, and paste the URL into
 * WHATSAPP_LOW_STOCK_ENDPOINT. Its template variables are filled in order:
 * the first gets "<product> (<size>)", the second the units left.
 *
 * Without the endpoint the alert is only logged; the "Low stock" list in
 * admin shows the same products either way.
 */
export async function sendLowStockAlert({ title, size, left }: { title: string; size: string; left: number }) {
  const product = `${title.split("|")[0].trim()} (${size})`;
  const endpoint = process.env.WHATSAPP_LOW_STOCK_ENDPOINT?.trim();
  if (!endpoint) {
    console.warn(`Low stock: ${product} has ${left} left (WHATSAPP_LOW_STOCK_ENDPOINT not set).`);
    return;
  }

  try {
    const url = new URL(endpoint);
    // Variables are named like templateVariable-product-1; order by the trailing number.
    const variableKeys = [...url.searchParams.keys()]
      .filter((key) => /variable/i.test(key))
      .sort((a, b) => Number(a.match(/(\d+)$/)?.[1] ?? 0) - Number(b.match(/(\d+)$/)?.[1] ?? 0));
    const values = [product, left === 0 ? "0 (sold out)" : String(left)];
    variableKeys.forEach((key, index) => url.searchParams.set(key, values[index] ?? values[values.length - 1]));

    const response = await fetch(url, { method: "GET", cache: "no-store" });
    const body = (await response.json().catch(() => null)) as { status?: unknown; message?: string } | null;
    // These panels answer 200 even on failure, with e.g. {"status":"0","message":"…"}.
    if (!response.ok || body?.status === 0 || body?.status === "0" || body?.status === false) {
      console.error("Low stock WhatsApp alert failed:", product, body?.message ?? response.status);
    }
  } catch (error) {
    console.error("Low stock WhatsApp alert failed:", product, error);
  }
}
