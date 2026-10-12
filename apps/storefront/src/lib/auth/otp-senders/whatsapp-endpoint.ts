import "server-only";

/**
 * WhatsApp OTP via a BotSailor-style panel (e.g. WaSarathi). In the panel:
 * API Developer → Generate API End-point → "Send Template Message (GET)",
 * pick the approved Authentication template, and paste the generated URL
 * into WHATSAPP_OTP_ENDPOINT. It looks like:
 *
 *   https://<panel>/api/v1/whatsapp/send/template?apiToken=…&phone_number_id=…&template_id=…
 *     &templateVariable-OTP-1=…&templateVariable-BRAND-2=…&templateVariable-OTP-3=…&phone_number=…
 *
 * Each send fills the template variable with the code and the recipient with
 * the shopper's number (country code, no "+"), keeping everything else as-is.
 */
export function isWhatsAppEndpointConfigured() {
  return Boolean(process.env.WHATSAPP_OTP_ENDPOINT?.trim());
}

export async function sendViaWhatsAppEndpoint(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const template = process.env.WHATSAPP_OTP_ENDPOINT?.trim();
  if (!template) return { ok: false, error: "WHATSAPP_OTP_ENDPOINT not configured" };

  let url: URL;
  try {
    url = new URL(template);
  } catch {
    return { ok: false, error: "WHATSAPP_OTP_ENDPOINT is not a valid URL" };
  }

  // The code goes into the template variables named for it (WaSarathi/BotSailor:
  // templateVariable-OTP-1 for the body, templateVariable-OTP-3 for the copy-code button).
  // Other variables, e.g. templateVariable-BRAND-2 ("…your OTP code for Leyros Perfume"), keep
  // the value saved in the link. If no variable is named for the code, every variable gets it.
  const keys = [...url.searchParams.keys()];
  const variableKeys = keys.filter((key) => /variable/i.test(key) || /^(otp|code)$/i.test(key));
  const codeKeys = variableKeys.filter((key) => /otp|code/i.test(key));
  if (variableKeys.length === 0) return { ok: false, error: "WHATSAPP_OTP_ENDPOINT has no template-variable parameter for the code" };
  for (const key of codeKeys.length ? codeKeys : variableKeys) url.searchParams.set(key, code);
  // Recipient, with country code and digits only. WaSarathi calls it phone_number; BotSailor sendToPhoneNumber.
  const recipientKeys = keys.filter((key) => key === "phone_number" || key === "sendToPhoneNumber");
  for (const key of recipientKeys.length ? recipientKeys : ["phone_number"]) url.searchParams.set(key, `91${phone}`);

  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    const text = await response.text();
    let body: Record<string, unknown> | null = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    // These panels answer 200 even on failure, with e.g. {"status":"0","message":"…"}.
    const status = body?.status;
    const failed =
      !response.ok ||
      status === 0 || status === "0" || status === false || status === "error" || status === "failed" ||
      Boolean(body?.error);
    if (failed) {
      const message = (body?.message ?? body?.error ?? text.slice(0, 160)) as string;
      return { ok: false, error: `WhatsApp panel: ${message || response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "WhatsApp panel request failed" };
  }
}
