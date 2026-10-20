const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"] as const;

function statusIndex(status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === "delivered") return 3;
  if (normalized === "shipped") return 2;
  if (normalized === "processing") return 1;
  return 0;
}

/** Courier details from Shiprocket tracking, once the order has an AWB. */
export interface OrderShipment {
  courierName?: string;
  awbCode?: string;
  trackingUrl?: string;
  /** Shiprocket's raw status, e.g. "OUT FOR DELIVERY". */
  shiprocketStatus?: string;
  estimatedDelivery?: string;
}

function formatEstimate(value: string) {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function OrderTrackingStatus({ status = "Order placed", shipment }: { status?: string; shipment?: OrderShipment }) {
  const activeIndex = statusIndex(status);
  const normalized = status.toLowerCase();
  const stopped = normalized === "cancelled" || normalized === "returned";
  const liveStatus = shipment?.shiprocketStatus && !stopped && normalized !== "delivered" ? shipment.shiprocketStatus.toLowerCase() : "";
  return (
    <section className={`order-tracking-status${stopped ? " is-cancelled" : ""}`} aria-label="Order tracking status">
      <header>
        <b>{normalized === "cancelled" ? "Order cancelled" : normalized === "returned" ? "Order returned" : "Track your order"}</b>
        <span>{stopped ? "Contact support if you need help" : liveStatus ? `Latest update: ${liveStatus}` : "Updates appear here as your order moves"}</span>
      </header>
      {!stopped && (
        <ol>
          {STEPS.map((step, index) => <li key={step} className={index <= activeIndex ? "is-complete" : ""}><i aria-hidden="true">{index < activeIndex ? "✓" : index + 1}</i><span>{step}</span></li>)}
        </ol>
      )}
      {shipment?.awbCode && (
        <p className="order-tracking-courier">
          <span>{shipment.courierName ? `${shipment.courierName} · ` : ""}AWB {shipment.awbCode}</span>
          {shipment.estimatedDelivery && !stopped && normalized !== "delivered" && <span>Expected by {formatEstimate(shipment.estimatedDelivery)}</span>}
          {shipment.trackingUrl && <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">Track shipment</a>}
        </p>
      )}
    </section>
  );
}
