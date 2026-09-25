"use client";

import { useEffect, useState } from "react";
import { getWhatsAppConsent, setWhatsAppConsent } from "@/lib/cart-recovery/client";

export function WhatsAppOptIn() {
  const [checked, setChecked] = useState(true);

  useEffect(() => setChecked(getWhatsAppConsent()), []);

  return (
    <label className="cart-step-checkbox whatsapp-optin">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          setChecked(event.target.checked);
          setWhatsAppConsent(event.target.checked);
        }}
      />
      <span>Send me order updates, cart reminders &amp; offers on WhatsApp</span>
    </label>
  );
}
