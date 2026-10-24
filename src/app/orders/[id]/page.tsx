import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import OrderSummary from "@/components/OrderSummary";
export const dynamic = "force-dynamic";
export default async function OrderPage({ params }: { params: { id: string } }) {
  const u = await currentUser(); if (!u) redirect(`/login?next=/orders/${params.id}`);
  const o = await db.order.findUnique({ where: { id: params.id }, include: { items: true, slot: true } });
  if (!o || (o.userId !== u.id && u.role === "CUSTOMER")) notFound();
  return <div className="mx-auto max-w-2xl px-5 py-12"><OrderSummary o={o} /></div>;
}
