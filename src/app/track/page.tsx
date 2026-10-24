import { db } from "@/lib/db";
import OrderSummary from "@/components/OrderSummary";
export const dynamic = "force-dynamic";
export default async function Track({ searchParams }: { searchParams: { number?: string; phone?: string } }) {
  const n = Number(searchParams.number), phone = searchParams.phone;
  const o = n && phone ? await db.order.findFirst({ where: { number: n, contactPhone: phone }, include: { items: true, slot: true } }) : null;
  const c = "rounded-lg border border-stone-300 bg-white px-3 py-2";
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-12"><h1 className="text-3xl text-burgundy">Track your order</h1>
      <form className="flex flex-wrap gap-3"><input name="number" required inputMode="numeric" defaultValue={searchParams.number} placeholder="Order number" aria-label="Order number" className={c} />
        <input name="phone" required inputMode="numeric" defaultValue={phone} placeholder="Mobile used for the order" aria-label="Mobile number" className={c} /><button className="btn">Track</button></form>
      {n && phone && !o && <p role="alert" className="text-red-700">We could not find an order with those details.</p>}
      {o && <OrderSummary o={o} phone={phone} />}</div>
  );
}
