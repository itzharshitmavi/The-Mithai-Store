import Link from "next/link";
import { db } from "@/lib/db";
import { fmt } from "@/lib/money";
import { FLOW, LABEL } from "@/lib/flow";
import { ActionButton } from "@/components/ui";
import { Page, card } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
const FILTERS = ["ALL", "PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REJECTED"];
export default async function Orders({ searchParams }: { searchParams: { status?: string } }) {
  const st = searchParams.status && searchParams.status !== "ALL" ? (searchParams.status as any) : undefined;
  const orders = await db.order.findMany({ where: st ? { status: st } : {}, orderBy: { createdAt: "desc" }, take: 100, include: { items: true, slot: true, user: true, notifications: true } });
  return (
    <Page title="Orders">
      <div className="flex flex-wrap gap-2 text-xs">{FILTERS.map((f) => <Link key={f} href={`/admin/orders?status=${f}`} className={`rounded-full border px-3 py-1 ${(searchParams.status ?? "ALL") === f ? "border-burgundy bg-burgundy text-cream" : "border-gold/50"}`}>{f === "ALL" ? "All" : LABEL[f]}</Link>)}</div>
      {orders.length === 0 && <p className="text-stone-500">No orders here.</p>}
      {orders.map((o) => (
        <details key={o.id} className={card} open={o.status === "PLACED"}>
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2"><span className="text-burgundy">#{o.number} · {o.contactName} · {fmt(o.totalPaise)}</span>
            <span className="text-xs">{LABEL[o.status]} · {o.paymentMethod} {o.paymentStatus.replace("_", " ")} · {o.fulfilment}</span></summary>
          <div className="mt-3 space-y-2 text-sm">
            <p>{new Date(o.slot.date).toLocaleDateString("en-IN", { timeZone: "UTC" })} {o.slot.startTime}–{o.slot.endTime} · <a href={`tel:${o.contactPhone}`} className="underline">{o.contactPhone}</a> · {o.user?.email ?? o.guestEmail}</p>
            {o.addressLine && <p>{o.addressLine}, {o.pincode}</p>}{o.note && <p className="italic">Note: {o.note}</p>}
            <ul>{o.items.map((i) => <li key={i.id}>{i.productName} · {i.variantLabel} × {i.qty}</li>)}</ul>
            {o.couponCode && <p>Coupon {o.couponCode}: -{fmt(o.discountPaise)}</p>}
            <div className="flex flex-wrap gap-2 pt-1">{(FLOW[o.status] ?? []).map((s) => <ActionButton key={s} url="/api/admin/orders/status" body={{ orderId: o.id, status: s }} label={s === "CONFIRMED" ? "Accept" : s === "REJECTED" ? "Reject" : s === "CANCELLED" ? "Cancel" : LABEL[s]} confirmText={s === "CANCELLED" || s === "REJECTED" ? "This releases the stock. Continue?" : undefined} />)}
              {o.paymentStatus === "REFUND_PENDING" && <><ActionButton url="/api/admin/orders/refund" body={{ orderId: o.id }} label="Refund via Razorpay" confirmText="Refund the full amount?" /><ActionButton url="/api/admin/orders/refund" body={{ orderId: o.id, manual: true }} label="Mark refunded" /></>}</div>
            {o.notifications.some((n) => n.status === "FAILED") && <div className="rounded-lg bg-red-50 p-2 text-red-800">Email failed. Contact the customer by phone.
              {o.notifications.filter((n) => n.status === "FAILED").map((n) => <span key={n.id} className="ml-2 inline-block"><ActionButton url="/api/admin/notifications" body={{ id: n.id }} label="Retry email" /></span>)}</div>}
          </div>
        </details>))}
    </Page>
  );
}
