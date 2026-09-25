import "server-only";

export type ReminderSendResult = { ok: true; mode: "sent" | "logged" } | { ok: false; error: string };

export function isWhatsAppCartConfigured() {
  return Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_CART_TEMPLATE_NAME);
}

// WhatsApp rejects template parameters containing newlines, tabs or 4+ spaces in a row.
function templateSafe(text: string, max = 900) {
  return text.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max) || "-";
}

/**
 * Sends the approved "cart reminder" marketing template. Expected template
 * (create it once in your WhatsApp provider's dashboard, category Marketing):
 *
 *   Body:   Hi {{1}}, you left something in your Leyros bag: {{2}}. {{3}}
 *   Button: URL button "Complete my order" → https://www.leyros.in/r/{{1}}
 *
 * {{1}} name · {{2}} product list · {{3}} coupon / closing line; the button's
 * {{1}} is the cart restore token. Payload follows Meta's Cloud API template
 * format, which most Indian BSPs (Interakt, AiSensy, Gupshup, WATI, MSG91)
 * accept as-is or with light wrapping — verify against your provider's docs.
 */
export async function sendCartReminder(input: {
  phone: string;
  name: string;
  products: string;
  closingLine: string;
  restoreToken: string;
  restoreUrl: string;
}): Promise<ReminderSendResult> {
  if (!isWhatsAppCartConfigured()) {
    console.info(
      `[cart-reminder:log-only] to +91${input.phone} — Hi ${input.name}, you left something in your Leyros bag: ${input.products}. ${input.closingLine} → ${input.restoreUrl}`,
    );
    return { ok: true, mode: "logged" };
  }

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL as string, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `91${input.phone}`,
        type: "template",
        template: {
          name: process.env.WHATSAPP_CART_TEMPLATE_NAME,
          language: { code: process.env.WHATSAPP_CART_TEMPLATE_LANG || "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: templateSafe(input.name, 60) },
                { type: "text", text: templateSafe(input.products, 700) },
                { type: "text", text: templateSafe(input.closingLine, 200) },
              ],
            },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: input.restoreToken }] },
          ],
        },
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error?.message ?? `WhatsApp API responded ${response.status}` };
    return { ok: true, mode: "sent" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "WhatsApp API request failed" };
  }
}
