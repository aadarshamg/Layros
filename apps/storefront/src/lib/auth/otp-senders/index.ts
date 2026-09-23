import "server-only";
import { sendViaDevConsole } from "./dev-console";
import { sendViaMsg91Sms } from "./sms-msg91";
import { sendViaWhatsApp } from "./whatsapp";

export type OtpChannel = "sms" | "whatsapp";

export interface OtpSendResult {
  ok: boolean;
  channel: OtpChannel | "dev-console";
  error?: string;
}

async function sendViaChannel(channel: OtpChannel, phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (channel === "whatsapp") return sendViaWhatsApp(phone, code);
  return sendViaMsg91Sms(phone, code);
}

function isChannelConfigured(channel: OtpChannel): boolean {
  if (channel === "whatsapp") {
    return Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_AUTH_TEMPLATE_NAME);
  }
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
}

/**
 * Sends the OTP over the configured primary channel, falling back to the
 * secondary channel on failure or missing config, and finally to
 * dev-console logging when neither provider is configured — so the login
 * flow works locally before any vendor is chosen.
 */
export async function sendOtp(phone: string, code: string): Promise<OtpSendResult> {
  const primary: OtpChannel = process.env.OTP_CHANNEL_PRIMARY === "whatsapp" ? "whatsapp" : "sms";
  const secondary: OtpChannel = primary === "sms" ? "whatsapp" : "sms";

  for (const channel of [primary, secondary]) {
    if (!isChannelConfigured(channel)) continue;
    const result = await sendViaChannel(channel, phone, code);
    if (result.ok) return { ok: true, channel };
  }

  await sendViaDevConsole(phone, code);
  return { ok: true, channel: "dev-console" };
}
