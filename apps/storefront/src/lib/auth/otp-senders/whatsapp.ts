import "server-only";

/**
 * WhatsApp Business API — Authentication template sender. Wired now, but
 * inactive until WHATSAPP_API_URL/WHATSAPP_API_TOKEN/WHATSAPP_AUTH_TEMPLATE_NAME
 * are set (see .env.example) and OTP_CHANNEL_PRIMARY=whatsapp is flipped on —
 * no other code change needed once a provider is chosen.
 *
 * Body shape follows Meta's own WhatsApp Cloud API for template messages,
 * which most BSPs (Interakt, Gupshup, AiSensy, WATI, MSG91's WhatsApp
 * product) either proxy directly or closely mirror. WHATSAPP_API_URL should
 * point at that provider's send-message endpoint; double-check the exact
 * shape against whichever BSP is actually chosen before relying on this in
 * production — some wrap this payload slightly differently.
 *
 * The Authentication template itself (its approved name/language) must be
 * created once in the BSP's dashboard — this call only supplies the code
 * to fill it with, same division of responsibility as the MSG91 SMS sender.
 */
export async function sendViaWhatsApp(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const templateName = process.env.WHATSAPP_AUTH_TEMPLATE_NAME;
  if (!apiUrl || !apiToken || !templateName) {
    return { ok: false, error: "WHATSAPP_API_URL / WHATSAPP_API_TOKEN / WHATSAPP_AUTH_TEMPLATE_NAME not configured" };
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `91${phone}`,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
          ],
        },
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, error: body?.error?.message ?? `WhatsApp API responded ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "WhatsApp API request failed" };
  }
}
