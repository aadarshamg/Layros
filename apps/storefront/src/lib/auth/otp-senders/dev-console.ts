import "server-only";

/**
 * Fallback sender used automatically when no real provider's env vars are
 * set — logs the code server-side so the whole login flow is testable
 * locally before a WhatsApp/SMS vendor is chosen. Never used in production
 * as long as MSG91_AUTH_KEY (or the WhatsApp vars) are configured.
 */
export async function sendViaDevConsole(phone: string, code: string): Promise<{ ok: true }> {
  console.log(`[dev-console OTP] ${phone}: ${code} (no OTP provider configured — see .env.example)`);
  return { ok: true };
}
