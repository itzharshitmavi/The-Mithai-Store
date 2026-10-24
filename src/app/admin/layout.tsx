import Link from "next/link";
import { requireRole } from "@/lib/auth";
const NAV = [["Dashboard", "/admin"], ["Orders", "/admin/orders"], ["Products", "/admin/products"], ["Stock", "/admin/inventory"], ["Slots", "/admin/slots"], ["Festival", "/admin/festival"], ["Coupons", "/admin/coupons"], ["Customers", "/admin/customers"], ["Reviews", "/admin/reviews"], ["Corporate", "/admin/corporate"], ["Reports", "/admin/reports"], ["Settings", "/admin/settings"]];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await requireRole("ADMIN", "STAFF").catch(() => null);
  if (!u) return <p className="p-10 text-center">Not allowed. <Link href="/login?next=/admin" className="underline">Sign in</Link></p>;
  return (<div><nav aria-label="Admin" className="sticky top-[57px] z-10 overflow-x-auto whitespace-nowrap border-b border-gold/30 bg-white/80 px-5 py-2 text-sm backdrop-blur">
    {NAV.map(([l, h]) => <Link key={h} href={h} className="mr-5 inline-block py-1 text-burgundy">{l}</Link>)}</nav>{children}</div>);
}
