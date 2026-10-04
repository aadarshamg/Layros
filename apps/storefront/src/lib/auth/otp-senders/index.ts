import "server-only";
import { sendViaDevConsole } from "./dev-console";
import { sendViaMsg91Sms } from "./sms-msg91";
import { sendViaWhatsApp } from "./whatsapp";
import { isWhatsAppEndpointConfigured, sendViaWhatsAppEndpoint } from "./whatsapp-endpoint";

export type OtpChannel = "sms" | "whatsapp";

export interface OtpSendResult {
  ok: boolean;
  channel: OtpChannel | "dev-console" | "none";
  error?: string;
}

async function sendViaChannel(channel: OtpChannel, phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (channel === "whatsapp") {
    // A panel-generated GET endpoint (WaSarathi/BotSailor) takes priority over the Meta Cloud API format.
    return isWhatsAppEndpointConfigured() ? sendViaWhatsAppEndpoint(phone, code) : sendViaWhatsApp(phone, code);
  }
  return sendViaMsg91Sms(phone, code);
}

function isChannelConfigured(channel: OtpChannel): boolean {
  if (channel === "whatsapp") {
    return isWhatsAppEndpointConfigured() || Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_AUTH_TEMPLATE_NAME);
  }
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
}

/** Whether login codes can actually reach a phone: a provider is set up, or this is local development. */
export function isOtpDeliveryAvailable(): boolean {
  return isChannelConfigured("whatsapp") || isChannelConfigured("sms") || process.env.NODE_ENV !== "production";
}

/**
 * Sends the OTP over the configured primary channel, falling back to the
 * secondary one. Locally, with no provider set, the code is printed to the
 * server log so login can still be tested. In production that fallback is
 * off: if nothing could deliver the code the shopper sees an error rather
 * than "code sent" for a message that never arrives.
 */
export async function sendOtp(phone: string, code: string): Promise<OtpSendResult> {
  const primary: OtpChannel = process.env.OTP_CHANNEL_PRIMARY === "sms" ? "sms" : "whatsapp";
  const secondary: OtpChannel = primary === "sms" ? "whatsapp" : "sms";
  const errors: string[] = [];

  for (const channel of [primary, secondary]) {
    if (!isChannelConfigured(channel)) continue;
    const result = await sendViaChannel(channel, phone, code);
    if (result.ok) return { ok: true, channel };
    errors.push(`${channel}: ${result.error ?? "failed"}`);
  }

  if (process.env.NODE_ENV !== "production") {
    await sendViaDevConsole(phone, code);
    return { ok: true, channel: "dev-console" };
  }
  console.error("OTP could not be delivered:", errors.length ? errors.join(" | ") : "no OTP provider configured");
  return { ok: false, channel: "none", error: errors.join(" | ") || "no OTP provider configured" };
}
