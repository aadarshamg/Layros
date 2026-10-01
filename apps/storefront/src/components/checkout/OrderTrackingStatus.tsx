const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"] as const;

function statusIndex(status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === "delivered") return 3;
  if (normalized === "shipped") return 2;
  if (normalized === "processing") return 1;
  return 0;
}

export function OrderTrackingStatus({ status = "Order placed" }: { status?: string }) {
  const activeIndex = statusIndex(status);
  const cancelled = status.toLowerCase() === "cancelled";
  return (
    <section className={`order-tracking-status${cancelled ? " is-cancelled" : ""}`} aria-label="Order tracking status">
      <header><b>{cancelled ? "Order cancelled" : "Track your order"}</b><span>{cancelled ? "Contact support if you need help" : "Updates appear here as your order moves"}</span></header>
      {!cancelled && (
        <ol>
          {STEPS.map((step, index) => <li key={step} className={index <= activeIndex ? "is-complete" : ""}><i aria-hidden="true">{index < activeIndex ? "✓" : index + 1}</i><span>{step}</span></li>)}
        </ol>
      )}
    </section>
  );
}
