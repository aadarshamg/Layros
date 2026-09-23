import type { Metadata } from "next";
import { AdminStudio } from "./AdminStudio";

export const metadata: Metadata = {
  title: "Leyros Admin",
  robots: { index: false, follow: false },
};

// Static shell — Studio is a pure client app after hydration, it doesn't
// need this page re-rendered per request.
export const dynamic = "force-static";

export default function AdminPage() {
  return <AdminStudio />;
}
