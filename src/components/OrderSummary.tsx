import { fmt } from "@/lib/money";
import { LABEL } from "@/lib/flow";
import { ActionButton } from "@/components/ui";
const STEPS = ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"];
export default function OrderSummary({ o, phone }: { o: any; phone?: string }) {
  const closed = o.status === "CANCELLED" || o.status === "REJECTED";
  const steps = STEPS.filter((s) => !(s === "READY_FOR_PICKUP" && o.fulfilment === "DELIVERY") && !(s === "OUT_FOR_DELIVERY" && o.fulfilment === "PICKUP"));
  const idx = steps.indexOf(o.status);
  return (
    <div className="space-y-6 rounded-2xl border border-gold/40 bg-white/70 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-2xl text-burgundy">Order #{o.number}</h2><span className="text-sm text-stone-600">{new Date(o.createdAt).toLocaleString("en-IN")}</span></div>
      {closed ? <p className="rounded-lg bg-red-50 p-3 text-red-800">This order was {LABEL[o.status].toLowerCase()}.{o.paymentStatus === "REFUND_PENDING" && " Your refund is being processed by the shop."}{o.paymentStatus === "REFUNDED" && " Your payment has been refunded."}</p> :
        <ol className="flex flex-wrap gap-2 text-xs">{steps.map((s, i) => <li key={s} className={`rounded-full px-3 py-1 ${i <= idx ? "bg-burgundy text-cream" : "border border-gold/50 text-stone-500"}`}>{LABEL[s]}</li>)}</ol>}
      <p className="text-sm">{o.fulfilment === "DELIVERY" ? "Delivery" : "Pickup"} on {new Date(o.slot.date).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })}, {o.slot.startTime}–{o.slot.endTime}{o.addressLine ? ` · ${o.addressLine}, ${o.pincode}` : ""}</p>
      <ul className="divide-y divide-gold/20 text-sm">{o.items.map((i: any) => <li key={i.id} className="flex justify-between py-2"><span>{i.productName} · {i.variantLabel} × {i.qty}</span><span>{fmt(i.unitPricePaise * i.qty)}</span></li>)}</ul>
      <div className="space-y-1 text-sm">{o.discountPaise > 0 && <p className="flex justify-between"><span>Discount</span><span>-{fmt(o.discountPaise)}</span></p>}
        {o.deliveryPaise > 0 && <p className="flex justify-between"><span>Delivery</span><span>{fmt(o.deliveryPaise)}</span></p>}
        <p className="flex justify-between text-lg text-burgundy"><span>Total</span><span>{fmt(o.totalPaise)}</span></p></div>
      <p className="text-sm text-stone-600">Payment: {o.paymentMethod === "COD" ? "Cash / pay on receipt" : "Online"} · {o.paymentStatus.replace("_", " ").toLowerCase()}{o.paymentMethod === "ONLINE" && o.paymentStatus === "PENDING" && !closed && " (we are confirming your payment; this page updates automatically on refresh)"}</p>
      {!closed && ["PLACED", "CONFIRMED"].includes(o.status) && <ActionButton url="/api/orders/cancel" body={{ orderId: o.id, phone }} label="Cancel order" small={false} confirmText="Cancel this order? See our cancellation policy." />}
    </div>
  );
}
