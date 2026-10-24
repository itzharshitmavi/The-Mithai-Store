import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { fmt } from "@/lib/money";
import { LABEL } from "@/lib/flow";
export const dynamic = "force-dynamic";
export default async function Orders() {
  const u = await currentUser(); if (!u) redirect("/login?next=/orders");
  const orders = await db.order.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="mx-auto max-w-2xl px-5 py-12"><h1 className="mb-6 text-3xl text-burgundy">My orders</h1>
      {orders.length === 0 && <p className="text-stone-500">You have not placed any orders yet.</p>}
      <ul className="space-y-3">{orders.map((o) => <li key={o.id}><Link href={`/orders/${o.id}`} className="flex justify-between rounded-xl border border-gold/30 bg-white/70 p-4"><span>#{o.number} · {new Date(o.createdAt).toLocaleDateString("en-IN")}</span><span>{LABEL[o.status]} · {fmt(o.totalPaise)}</span></Link></li>)}</ul></div>
  );
}
