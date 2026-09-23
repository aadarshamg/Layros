import Link from "next/link";
import { getSessionCustomerId } from "@/lib/auth/session";
import { sanityClient } from "@/lib/sanity";
import { formatInr } from "@/lib/format";

interface CustomerOrder {
  _id: string;
  orderNumber: string;
  _createdAt: string;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "paid" | "pending" | "failed";
  fulfillmentStatus?: string;
  totalAmount: number;
  items: { title: string; quantity: number }[];
}

export default async function OrdersPage() {
  const customerId = await getSessionCustomerId();
  const orders = customerId
    ? await sanityClient.fetch<CustomerOrder[]>(
        `*[_type == "order" && customer._ref == $customerId] | order(_createdAt desc){
          _id, orderNumber, _createdAt, paymentMethod, paymentStatus, fulfillmentStatus, totalAmount,
          items[]{title, quantity}
        }`,
        { customerId },
        { cache: "no-store" },
      )
    : [];

  if (orders.length === 0) {
    return (
      <div className="text-sm text-charcoal-soft/70">
        <p>You haven&apos;t placed any orders yet.</p>
        <Link href="/collections/all" className="mt-4 inline-block rounded-full border border-charcoal px-8 py-3 text-xs uppercase tracking-widest hover:bg-charcoal hover:text-offwhite">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4 text-sm">
      {orders.map((order) => (
        <li key={order._id} className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">{order.orderNumber}</span>
            <span className="text-xs uppercase tracking-widest text-charcoal-soft/60">
              {new Date(order._createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="mt-1 text-charcoal-soft/70">
            {order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest">
            <span className="text-charcoal-soft/60">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"} · {order.fulfillmentStatus ?? "Unfulfilled"}
            </span>
            <span className="font-medium">{formatInr(order.totalAmount)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
