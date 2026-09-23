import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth/session";

const tabs = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Address" },
  { href: "/account/preferences", label: "Preferences" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-widest text-charcoal-soft/60">Account</p>
      <h1 className="mt-1 font-serif text-3xl">{customer.name ? `Hi, ${customer.name}` : `+91 ${customer.phone}`}</h1>
      <nav className="mt-8 flex gap-6 border-b border-border text-sm uppercase tracking-widest text-charcoal-soft/70">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="pb-3">
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
