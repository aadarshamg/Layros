"use client";

import { useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";

interface OrderRow {
  _createdAt: string;
  totalAmount: number;
  paymentStatus: "paid" | "pending" | "failed";
  paymentMethod: "razorpay" | "cod";
  items?: { title?: string; quantity?: number; unitPrice?: number }[];
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function daysAgo(n: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(0, 0, 0, 0);
  return date;
}

// A "sale" is any order that isn't a known failure — a COD order is a real
// placed order even before cash actually changes hands at the door.
function isCountable(order: OrderRow): boolean {
  return order.paymentStatus !== "failed";
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(120,120,130,.2)",
  background: "rgba(120,120,130,.04)",
};

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>{sublabel}</div>}
    </div>
  );
}

export default function SalesAnalytics() {
  const client = useClient({ apiVersion: "2025-01-01" });
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<OrderRow[]>(
        `*[_type == "order"] | order(_createdAt desc) {
          _createdAt, totalAmount, paymentStatus, paymentMethod,
          items[]{title, quantity, unitPrice}
        }`,
      )
      .then((rows) => {
        if (!cancelled) setOrders(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load orders.");
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const stats = useMemo(() => {
    if (!orders) return null;
    const sales = orders.filter(isCountable);

    const totalRevenue = sales.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const orderCount = sales.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    const since7 = daysAgo(7);
    const since30 = daysAgo(30);
    const last7DaysRevenue = sales.filter((o) => new Date(o._createdAt) >= since7).reduce((sum, o) => sum + o.totalAmount, 0);
    const last30DaysRevenue = sales.filter((o) => new Date(o._createdAt) >= since30).reduce((sum, o) => sum + o.totalAmount, 0);

    const codOrders = sales.filter((o) => o.paymentMethod === "cod");
    const pendingCodRevenue = codOrders.filter((o) => o.paymentStatus === "pending").reduce((sum, o) => sum + o.totalAmount, 0);

    const productTotals = new Map<string, { quantity: number; revenue: number }>();
    for (const order of sales) {
      for (const item of order.items ?? []) {
        if (!item.title) continue;
        const existing = productTotals.get(item.title) ?? { quantity: 0, revenue: 0 };
        existing.quantity += item.quantity ?? 0;
        existing.revenue += (item.unitPrice ?? 0) * (item.quantity ?? 0);
        productTotals.set(item.title, existing);
      }
    }
    const topProducts = [...productTotals.entries()]
      .map(([title, totals]) => ({ title, ...totals }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    const dailyBuckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      dailyBuckets.set(daysAgo(i).toISOString().slice(0, 10), 0);
    }
    for (const order of sales) {
      const key = order._createdAt.slice(0, 10);
      if (dailyBuckets.has(key)) {
        dailyBuckets.set(key, (dailyBuckets.get(key) ?? 0) + order.totalAmount);
      }
    }
    const dailyRevenue = [...dailyBuckets.entries()].map(([date, revenue]) => ({ date, revenue }));

    return { totalRevenue, orderCount, avgOrderValue, last7DaysRevenue, last30DaysRevenue, codCount: codOrders.length, pendingCodRevenue, topProducts, dailyRevenue };
  }, [orders]);

  if (error) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 32 }}>
        <div style={{ ...cardStyle, borderColor: "#c0392b", color: "#c0392b" }}>{error}</div>
      </div>
    );
  }

  if (!stats) {
    return <div style={{ padding: 48, textAlign: "center", opacity: 0.6 }}>Loading…</div>;
  }

  const maxDaily = Math.max(1, ...stats.dailyRevenue.map((d) => d.revenue));

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 32, display: "grid", gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Sales analytics</h1>
        <p style={{ fontSize: 13, opacity: 0.65, margin: 0 }}>
          Computed live from every order document — paid Razorpay orders and placed COD orders both count as sales; orders marked &quot;failed&quot; don&apos;t.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Total revenue" value={formatInr(stats.totalRevenue)} sublabel={`${stats.orderCount} orders`} />
        <StatCard label="Average order value" value={formatInr(stats.avgOrderValue)} />
        <StatCard label="Last 7 days" value={formatInr(stats.last7DaysRevenue)} />
        <StatCard label="Last 30 days" value={formatInr(stats.last30DaysRevenue)} />
      </div>

      <div style={cardStyle}>
        {stats.codCount} Cash on Delivery order{stats.codCount === 1 ? "" : "s"} — {formatInr(stats.pendingCodRevenue)} still to be collected on delivery.
      </div>

      <div>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Revenue, last 14 days</h2>
        <div style={{ ...cardStyle, display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
          {stats.dailyRevenue.map((day) => (
            <div key={day.date} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <div
                  title={`${day.date}: ${formatInr(day.revenue)}`}
                  style={{
                    width: "100%",
                    height: `${Math.max(2, (day.revenue / maxDaily) * 100)}%`,
                    background: "#6f665a",
                    borderRadius: 3,
                  }}
                />
              </div>
              <div style={{ fontSize: 9, opacity: 0.6, marginTop: 6, whiteSpace: "nowrap" }}>{day.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Top products by units sold</h2>
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {stats.topProducts.length === 0 ? (
            <div style={{ padding: 16, opacity: 0.6 }}>No sales yet.</div>
          ) : (
            stats.topProducts.map((product, index) => (
              <div
                key={product.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderTop: index === 0 ? undefined : "1px solid rgba(120,120,130,.15)",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.title}</span>
                <span style={{ fontSize: 12, opacity: 0.65, whiteSpace: "nowrap" }}>{product.quantity} sold</span>
                <span style={{ fontSize: 13, whiteSpace: "nowrap" }}>{formatInr(product.revenue)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
