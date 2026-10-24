import { db } from "@/lib/db";
import { fmt } from "@/lib/money";
import { Page, card, ownerOnly, NoAccess } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Customers() {
  if (!(await ownerOnly())) return <NoAccess />;
  const [users, spend] = await Promise.all([db.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { orders: true } } } }),
    db.order.groupBy({ by: ["userId"], _sum: { totalPaise: true }, where: { userId: { not: null }, status: { notIn: ["CANCELLED", "REJECTED"] } } })]);
  const total = new Map(spend.map((s) => [s.userId, s._sum.totalPaise ?? 0]));
  return (
    <Page title="Customers"><ul className={`${card} divide-y divide-gold/20 text-sm`}>
      {users.map((u) => <li key={u.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{u.name} · {u.email}{u.phone ? ` · ${u.phone}` : ""}</span><span>{u._count.orders} orders · {fmt(total.get(u.id) ?? 0)}</span></li>)}
      {users.length === 0 && <li className="py-2 text-stone-500">No registered customers yet. Guest orders appear under Orders.</li>}</ul></Page>
  );
}
