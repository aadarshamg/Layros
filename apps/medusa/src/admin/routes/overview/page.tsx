import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Link } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import "../../styles/admin.css"

type AdminOrder = {
  id: string
  display_id?: number
  email?: string
  total?: number
  currency_code?: string
  status?: string
  fulfillment_status?: string
  created_at?: string
}

type OrdersResponse = {
  orders?: AdminOrder[]
  count?: number
}

const formatMoney = (amount = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount)

const OverviewPage = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetch("/admin/orders?limit=100&order=-created_at", { credentials: "include" })
      .then((response) => response.ok ? response.json() as Promise<OrdersResponse> : Promise.reject(new Error("Could not load orders")))
      .then((data) => {
        if (!active) return
        setOrders(data.orders ?? [])
        setCount(data.count ?? data.orders?.length ?? 0)
      })
      .catch(() => {
        if (active) {
          setOrders([])
          setCount(0)
        }
      })
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [])

  const metrics = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + (order.total ?? 0), 0)
    const awaiting = orders.filter((order) => !["fulfilled", "shipped", "delivered"].includes(order.fulfillment_status ?? "")).length
    return {
      revenue,
      average: orders.length ? revenue / orders.length : 0,
      awaiting,
    }
  }, [orders])

  const currency = orders[0]?.currency_code ?? "INR"
  const currentDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())

  return (
    <div className="leyros-admin-dashboard">
      <header className="leyros-dashboard-head">
        <div>
          <p className="leyros-eyebrow">Maison command centre</p>
          <h1>Good day, LEYROS.</h1>
          <p>{currentDate} · A quiet view of everything that needs attention.</p>
        </div>
        <span className="leyros-live-pill">Store online</span>
      </header>

      <section className={`leyros-stat-grid ${loading ? "leyros-loading" : ""}`} aria-label="Store performance">
        <article className="leyros-stat-card"><div className="leyros-stat-top"><span>Gross revenue</span><span className="leyros-stat-index">01</span></div><strong>{formatMoney(metrics.revenue, currency)}</strong><small>Across the latest {orders.length || 0} orders</small></article>
        <article className="leyros-stat-card"><div className="leyros-stat-top"><span>Total orders</span><span className="leyros-stat-index">02</span></div><strong>{count}</strong><small>All recorded orders</small></article>
        <article className="leyros-stat-card"><div className="leyros-stat-top"><span>Average order</span><span className="leyros-stat-index">03</span></div><strong>{formatMoney(metrics.average, currency)}</strong><small>Average cart value</small></article>
        <article className="leyros-stat-card"><div className="leyros-stat-top"><span>Awaiting fulfilment</span><span className="leyros-stat-index">04</span></div><strong>{metrics.awaiting}</strong><small>Orders requiring attention</small></article>
      </section>

      <section className="leyros-dashboard-grid">
        <article className="leyros-panel">
          <header className="leyros-panel-head"><h2>Recent orders</h2><Link to="/orders">View all orders →</Link></header>
          {orders.length ? orders.slice(0, 6).map((order) => (
            <Link to={`/orders/${order.id}`} className="leyros-order-row" key={order.id}>
              <strong>#{order.display_id ?? "—"}</strong>
              <span>{order.email || "Private client"}</span>
              <span className="leyros-status">{(order.fulfillment_status || order.status || "pending").replaceAll("_", " ")}</span>
              <span className="leyros-order-total">{formatMoney(order.total, order.currency_code)}</span>
            </Link>
          )) : (
            <div className="leyros-empty"><div><span className="leyros-empty-mark">L</span><h3>Your first order will appear here</h3><p>The atelier is ready. New purchases will surface here with fulfilment and payment status.</p></div></div>
          )}
        </article>

        <aside className="leyros-panel">
          <header className="leyros-panel-head"><h2>Quick actions</h2></header>
          <div className="leyros-actions">
            <Link to="/products/create" className="leyros-action">Add a fragrance <span>↗</span></Link>
            <Link to="/orders" className="leyros-action">Manage orders <span>↗</span></Link>
            <Link to="/inventory" className="leyros-action">Review inventory <span>↗</span></Link>
            <Link to="/customers" className="leyros-action">Client directory <span>↗</span></Link>
            <Link to="/promotions" className="leyros-action">Create promotion <span>↗</span></Link>
          </div>
        </aside>
      </section>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Overview",
  rank: 0,
})

export default OverviewPage
