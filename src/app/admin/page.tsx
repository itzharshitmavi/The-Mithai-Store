import { db } from "@/lib/db";
import { fmt } from "@/lib/money";
import { expireReservations } from "@/lib/orders";
import { Page, card } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Admin() {
  await expireReservations();
  const istDay = new Date(Date.now() + 19800000);
  istDay.setUTCHours(0, 0, 0, 0);
  const day = new Date(+istDay - 19800000);
  const [today, pending, sales, low, best, failedMail, refunds] =
    await Promise.all([
      db.order.count({ where: { createdAt: { gte: day } } }),
      db.order.count({ where: { status: "PLACED" } }),
      db.order.aggregate({
        _sum: { totalPaise: true },
        where: {
          createdAt: { gte: day },
          status: { notIn: ["CANCELLED", "REJECTED"] },
        },
      }),
      db.$queryRaw<
        {
          name: string;
          label: string;
          remainingQty: number;
        }[]
      >`
  SELECT
    p.name,
    v.label,
    (a."onlineQty" - a.reserved) AS "remainingQty"
  FROM "InventoryAllocation" a
  JOIN "Variant" v ON v.id = a."variantId"
  JOIN "Product" p ON p.id = v."productId"
  WHERE v.active
    AND p.active
    AND a."onlineQty" - a.reserved <= a."lowThreshold"
  ORDER BY (a."onlineQty" - a.reserved) ASC
  LIMIT 10
`,
      db.$queryRaw<
        { name: string; qty: number }[]
      >`SELECT i."productName" AS name, SUM(i.qty) AS qty FROM "OrderItem" i JOIN "Order" o ON o.id=i."orderId" WHERE o.status NOT IN ('CANCELLED','REJECTED') AND o."createdAt" > now() - interval '30 days' GROUP BY i."productName" ORDER BY qty DESC LIMIT 5`,
      db.notification.count({ where: { status: "FAILED" } }),
      db.order.count({ where: { paymentStatus: "REFUND_PENDING" } }),
    ]);
  const cards: [string, string | number][] = [
    ["Today's orders", today],
    ["Pending (new)", pending],
    ["Today's sales", fmt(sales._sum.totalPaise ?? 0)],
    ["Refunds to process", refunds],
    ["Failed emails", failedMail],
  ];
  return (
    <Page title="Dashboard">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map(([k, v]) => (
          <div key={k} className={card}>
            <p className="text-xs text-stone-500">{k}</p>
            <p className="text-2xl text-burgundy">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xl text-burgundy">Low online stock</h2>
          {low.length === 0 ? (
            <p className="text-stone-500">Nothing running low.</p>
          ) : (
            <ul className={`${card} divide-y divide-gold/20`}>
              {low.map((l, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>
                    {l.name} · {l.label}
                  </span>
                  <span className="text-burgundy">
                    {Number(l.remainingQty)} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-2 text-xl text-burgundy">Bestsellers (30 days)</h2>
          {best.length === 0 ? (
            <p className="text-stone-500">No sales yet.</p>
          ) : (
            <ul className={`${card} divide-y divide-gold/20`}>
              {best.map((b, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>{b.name}</span>
                  <span>{Number(b.qty)} sold</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}
