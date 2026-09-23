"use client";

import { useState } from "react";
import { WhatsAppIcon } from "@/components/layout/FooterIcons";
import { DEFAULT_WHATSAPP_NUMBER, DEFAULT_WHATSAPP_SUGGESTED_MESSAGE } from "@/lib/site-defaults";

export function WhatsAppButton({ number, suggestedMessage }: { number?: string; suggestedMessage?: string }) {
  const [dismissed, setDismissed] = useState(false);
  const digits = (number || DEFAULT_WHATSAPP_NUMBER).replace(/[^\d]/g, "");
  const message = suggestedMessage ?? DEFAULT_WHATSAPP_SUGGESTED_MESSAGE;
  const showBubble = Boolean(message) && !dismissed;

  function waLink(text?: string) {
    const base = `https://api.whatsapp.com/send?phone=${digits}`;
    return text ? `${base}&text=${encodeURIComponent(text)}` : base;
  }

  return (
    <div className="whatsapp-widget">
      {showBubble && (
        <div className="whatsapp-bubble">
          <button type="button" className="whatsapp-bubble-close" aria-label="Dismiss suggestion" onClick={() => setDismissed(true)}>
            ×
          </button>
          <a href={waLink(message)} target="_blank" rel="noreferrer" className="whatsapp-bubble-text">
            {message}
          </a>
        </div>
      )}
      <a href={waLink(message)} target="_blank" rel="noreferrer" className="whatsapp-float" aria-label="Chat with us on WhatsApp">
        <WhatsAppIcon />
        {showBubble && <span className="whatsapp-badge" aria-hidden="true">1</span>}
      </a>
    </div>
  );
}
