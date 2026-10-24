import { db } from "@/lib/db";
import { fmt } from "@/lib/money";
import { Page, card, ownerOnly, NoAccess } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Reports() {
  if (!(await ownerOnly())) return <NoAccess />;
  const [days, top, split] = await Promise.all([
    db.$queryRaw<{ d: Date; orders: bigint; sales: bigint }[]>`SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Kolkata') AS d, COUNT(*) AS orders, COALESCE(SUM("totalPaise"),0) AS sales FROM "Order" WHERE status NOT IN ('CANCELLED','REJECTED') AND "createdAt" > now() - interval '14 days' GROUP BY 1 ORDER BY 1 DESC`,
    db.$queryRaw<{ name: string; label: string; qty: bigint; revenue: bigint }[]>`SELECT i."productName" AS name, i."variantLabel" AS label, SUM(i.qty) AS qty, SUM(i.qty * i."unitPricePaise") AS revenue FROM "OrderItem" i JOIN "Order" o ON o.id=i."orderId" WHERE o.status NOT IN ('CANCELLED','REJECTED') AND o."createdAt" > now() - interval '30 days' GROUP BY 1,2 ORDER BY revenue DESC LIMIT 15`,
    db.order.groupBy({ by: ["status"], _count: true, where: { createdAt: { gt: new Date(Date.now() - 30 * 86400000) } } }),
  ]);
  const totalSales = days.reduce((a, d) => a + Number(d.sales), 0);
  return (
    <Page title="Sales reports">
      <section><h2 className="mb-2 text-xl text-burgundy">Last 14 days · {fmt(totalSales)}</h2><ul className={`${card} divide-y divide-gold/20 text-sm`}>
        {days.map((d, i) => <li key={i} className="flex justify-between py-2"><span>{new Date(d.d).toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" })}</span><span>{Number(d.orders)} orders · {fmt(Number(d.sales))}</span></li>)}{days.length === 0 && <li className="py-2 text-stone-500">No sales yet.</li>}</ul></section>
      <section><h2 className="mb-2 text-xl text-burgundy">Top items (30 days)</h2><ul className={`${card} divide-y divide-gold/20 text-sm`}>
        {top.map((t, i) => <li key={i} className="flex justify-between py-2"><span>{t.name} · {t.label}</span><span>{Number(t.qty)} sold · {fmt(Number(t.revenue))}</span></li>)}{top.length === 0 && <li className="py-2 text-stone-500">No data.</li>}</ul></section>
      <section><h2 className="mb-2 text-xl text-burgundy">Orders by status (30 days)</h2><p className="text-sm">{split.map((s) => `${s.status.replace(/_/g, " ").toLowerCase()}: ${s._count}`).join(" · ") || "None"}</p></section>
    </Page>
  );
}
