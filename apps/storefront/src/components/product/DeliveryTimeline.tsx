"use client";

import { useEffect, useState } from "react";

// Business days are Mon–Sat, the usual courier week in India.
function isBusinessDay(date: Date) {
  return date.getUTCDay() !== 0;
}

function addBusinessDays(start: Date, days: number) {
  const date = new Date(start);
  while (!isBusinessDay(date)) date.setUTCDate(date.getUTCDate() + 1);
  let remaining = days;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (isBusinessDay(date)) remaining -= 1;
  }
  return date;
}

// Today's calendar date in India, as a UTC-midnight Date so day arithmetic
// isn't affected by the visitor's own timezone.
function todayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(`${parts}T00:00:00Z`);
}

const formatDay = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

interface Dates {
  order: string;
  shipped: string;
  delivery: string;
}

export function DeliveryTimeline({ dispatchDays, deliveryDaysMin, deliveryDaysMax }: { dispatchDays: number; deliveryDaysMin: number; deliveryDaysMax: number }) {
  const [dates, setDates] = useState<Dates | null>(null);

  useEffect(() => {
    const today = todayInIndia();
    const shipped = addBusinessDays(today, dispatchDays);
    const earliest = addBusinessDays(shipped, deliveryDaysMin);
    const latest = addBusinessDays(shipped, Math.max(deliveryDaysMin, deliveryDaysMax));
    setDates({
      order: formatDay(today),
      shipped: formatDay(shipped),
      delivery: earliest.getTime() === latest.getTime() ? formatDay(earliest) : `${formatDay(earliest)} – ${formatDay(latest)}`,
    });
  }, [dispatchDays, deliveryDaysMin, deliveryDaysMax]);

  const steps = [
    { label: "Order today", value: dates?.order, icon: <BagIcon /> },
    { label: "Shipped by", value: dates?.shipped, icon: <TruckIcon /> },
    { label: "Delivery", value: dates?.delivery, icon: <PinIcon /> },
  ];

  return (
    <section className="delivery-timeline" aria-label="Estimated delivery">
      <p className="delivery-timeline-note">
        Ships within {dispatchDays} business {dispatchDays === 1 ? "day" : "days"} · delivered {deliveryDaysMin}–{deliveryDaysMax} business days after dispatch
      </p>
      <ol className="delivery-timeline-track">
        {steps.map((step) => (
          <li key={step.label} className="delivery-timeline-step">
            <span className="delivery-timeline-icon" aria-hidden="true">{step.icon}</span>
            <span className="delivery-timeline-label">{step.label}</span>
            <b className="delivery-timeline-date">{step.value ?? " "}</b>
          </li>
        ))}
      </ol>
      <p className="delivery-timeline-fineprint">Estimated for delivery within India; remote PIN codes can take a little longer.</p>
    </section>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7h12l-1 13H7L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h11v10H2z" />
      <path d="M13 9h4l4 4v3h-8z" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <path d="m9.2 9.6 2 2 3.6-3.8" />
    </svg>
  );
}
