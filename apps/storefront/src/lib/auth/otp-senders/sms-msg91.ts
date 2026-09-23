import "server-only";

/**
 * MSG91 SMS OTP — the working channel from day one (no WhatsApp Business
 * API approval to wait on). Sends the code we generated ourselves rather
 * than letting MSG91 generate one, since verification happens against our
 * own signed challenge cookie (lib/auth/otp.ts), not MSG91's side.
 *
 * MSG91's OTP template text must itself contain the "##OTP##" placeholder
 * (configured once in the MSG91 dashboard when creating MSG91_TEMPLATE_ID) —
 * this call just supplies the value to fill it with.
 */
export async function sendViaMsg91Sms(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    return { ok: false, error: "MSG91_AUTH_KEY / MSG91_TEMPLATE_ID not configured" };
  }

  const mobile = `91${phone}`; // MSG91 expects country code, no leading +
  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", templateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp", code);
  if (process.env.MSG91_SENDER_ID) url.searchParams.set("sender", process.env.MSG91_SENDER_ID);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { authkey: authKey, "Content-Type": "application/json" },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.type === "error") {
      return { ok: false, error: body?.message ?? `MSG91 responded ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "MSG91 request failed" };
  }
}
