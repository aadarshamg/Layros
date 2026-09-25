"use client";

const CONSENT_KEY = "leyros_whatsapp_optin";
const GUEST_PHONE_KEY = "leyros_checkout_phone";
const GUEST_NAME_KEY = "leyros_checkout_name";
export const RECOVERY_CONTACT_EVENT = "leyros:recovery-contact";

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked — consent just won't be remembered across visits.
  }
}

/** WhatsApp updates opt-in; defaults to on until the shopper unticks it. */
export function getWhatsAppConsent() {
  return read(CONSENT_KEY) !== "0";
}

export function setWhatsAppConsent(value: boolean) {
  write(CONSENT_KEY, value ? "1" : "0");
  window.dispatchEvent(new Event(RECOVERY_CONTACT_EVENT));
}

export function getGuestContact(): { phone?: string; name?: string } {
  return { phone: read(GUEST_PHONE_KEY) ?? undefined, name: read(GUEST_NAME_KEY) ?? undefined };
}

export function setGuestContact(phone: string | undefined, name: string | undefined) {
  if (phone) write(GUEST_PHONE_KEY, phone);
  if (name) write(GUEST_NAME_KEY, name);
  window.dispatchEvent(new Event(RECOVERY_CONTACT_EVENT));
}
