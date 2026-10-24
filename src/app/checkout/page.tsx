"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/money";
declare global { interface Window { Razorpay: any } }
type Slot = { id: string; start: string; end: string; available: boolean; label?: string };
const today = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const inp = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2";
function loadRzp() { return new Promise<void>((res, rej) => { if (window.Razorpay) return res(); const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => res(); s.onerror = () => rej(new Error("Could not load payment window")); document.body.appendChild(s); }); }

export default function Checkout() {
  const { items, total, clear } = useCart();
  const key = useRef(""); const itemsSig = JSON.stringify(items.map((i) => [i.variantId, i.qty]));
  useEffect(() => { key.current = crypto.randomUUID(); }, [itemsSig]);
  const [shop, setShop] = useState<any>(null); const [me, setMe] = useState<any>(null);
  const [fulfilment, setFulfilment] = useState<"DELIVERY" | "PICKUP">("DELIVERY"); const [date, setDate] = useState(today());
  const [slots, setSlots] = useState<Slot[]>([]); const [slotMsg, setSlotMsg] = useState(""); const [slotId, setSlotId] = useState("");
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", pincode: "", note: "" });
  const [coupon, setCoupon] = useState(""); const [discount, setDiscount] = useState(0); const [couponMsg, setCouponMsg] = useState("");
  const [pay, setPay] = useState<"COD" | "ONLINE">("COD"); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [notice, setNotice] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => { fetch("/api/shop").then((r) => r.json()).then(setShop); fetch("/api/me").then((r) => r.json()).then((u) => { setMe(u); if (u) setF((p) => ({ ...p, name: u.name, phone: u.phone ?? "", email: u.email, address: u.address?.line1 ?? "", pincode: u.address?.pincode ?? "" })); }); }, []);
  useEffect(() => { setSlotId(""); setSlots([]); setSlotMsg("");
    fetch(`/api/slots?date=${date}&type=${fulfilment}`).then((r) => r.json()).then((d) => { setSlots(d.slots ?? []); setSlotMsg(d.message ?? d.error ?? ""); }); }, [date, fulfilment]);

  if (items.length === 0) return <div className="mx-auto max-w-lg px-5 py-24 text-center"><h1 className="text-3xl text-burgundy">Nothing to check out</h1><Link href="/products" className="btn mt-6">Browse sweets</Link></div>;
  const fee = shop && fulfilment === "DELIVERY" && total - discount < shop.freeDeliveryAbovePaise ? shop.deliveryFeePaise : 0;
  async function applyCoupon() {
    setCouponMsg(""); setDiscount(0);
    const r = await fetch("/api/coupons/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: coupon, subtotalPaise: total }) }); const d = await r.json();
    r.ok ? (setDiscount(d.discountPaise), setCouponMsg(`Coupon applied: -${fmt(d.discountPaise)}`)) : setCouponMsg(d.error);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setNotice("");
    if (!slotId) return setErr("Please choose a time slot");
    setBusy(true);
    const r = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      idempotencyKey: key.current, items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })), fulfilment, slotId, paymentMethod: pay,
      contactName: f.name, contactPhone: f.phone, guestEmail: me ? undefined : f.email, addressLine: fulfilment === "DELIVERY" ? f.address : undefined,
      pincode: fulfilment === "DELIVERY" ? f.pincode : undefined, couponCode: coupon || undefined, note: f.note || undefined }) });
    const d = await r.json();
    if (!r.ok) { setBusy(false); return setErr(d.error); }
    const finish = () => { clear(); location.href = me ? `/orders/${d.orderId}` : `/track?number=${d.number}&phone=${f.phone}`; };
    if (!d.razorpay) return finish();
    try {
      await loadRzp();
      new window.Razorpay({ key: d.razorpay.keyId, amount: d.razorpay.amount, currency: "INR", order_id: d.razorpay.orderId, name: shop?.name, prefill: { name: f.name, email: f.email, contact: f.phone },
        handler: finish, modal: { ondismiss: () => { setBusy(false); setNotice("Payment not completed. Your items are held for a few minutes. Tap Pay again to retry."); } } }).open();
    } catch (x: any) { setBusy(false); setErr(x.message); }
  }
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-10 px-5 py-12 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <h1 className="text-3xl text-burgundy">Checkout</h1>
        {shop?.paused && <p role="alert" className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Online ordering is paused right now. You can still browse, but orders cannot be placed.</p>}
        <fieldset className="space-y-3"><legend className="mb-2 text-lg text-burgundy">How would you like it?</legend>
          <div className="flex gap-3">{(["DELIVERY", "PICKUP"] as const).map((t) => <button type="button" key={t} aria-pressed={fulfilment === t} onClick={() => setFulfilment(t)} className={`rounded-full border px-5 py-2 text-sm ${fulfilment === t ? "border-burgundy bg-burgundy text-cream" : "border-gold/60"}`}>{t === "DELIVERY" ? "Home delivery" : "Store pickup"}</button>)}</div></fieldset>
        <fieldset className="space-y-3"><legend className="mb-2 text-lg text-burgundy">Date &amp; time</legend>
          <input type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} aria-label="Date" className={inp + " max-w-xs"} />
          <div className="flex flex-wrap gap-2">{slots.map((s) => <button type="button" key={s.id} disabled={!s.available} aria-pressed={slotId === s.id} onClick={() => setSlotId(s.id)}
            className={`rounded-lg border px-4 py-2 text-sm ${slotId === s.id ? "border-burgundy bg-burgundy text-cream" : "border-gold/60"} disabled:opacity-40`}>{s.start}–{s.end}{s.label ? ` · ${s.label}` : ""}</button>)}</div>
          {slotMsg && <p className="text-sm text-stone-600">{slotMsg}</p>}</fieldset>
        <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-lg text-burgundy sm:col-span-2">Your details</legend>
          <input required placeholder="Full name" aria-label="Full name" value={f.name} onChange={set("name")} className={inp} />
          <input required inputMode="numeric" placeholder="Mobile (10 digits)" aria-label="Mobile number" value={f.phone} onChange={set("phone")} className={inp} />
          {!me && <input required type="email" placeholder="Email (for order updates)" aria-label="Email" value={f.email} onChange={set("email")} className={inp + " sm:col-span-2"} />}
          {fulfilment === "DELIVERY" && <><textarea required placeholder="Delivery address" aria-label="Delivery address" value={f.address} onChange={set("address")} className={inp + " sm:col-span-2"} />
            <input required inputMode="numeric" maxLength={6} placeholder="PIN code" aria-label="PIN code" value={f.pincode} onChange={set("pincode")} className={inp} /></>}
          <input placeholder="Note (optional)" aria-label="Note" value={f.note} onChange={set("note")} className={inp + " sm:col-span-2"} /></fieldset>
        <fieldset><legend className="mb-2 text-lg text-burgundy">Payment</legend><div className="flex flex-wrap gap-3">
          <button type="button" aria-pressed={pay === "COD"} onClick={() => setPay("COD")} className={`rounded-full border px-5 py-2 text-sm ${pay === "COD" ? "border-burgundy bg-burgundy text-cream" : "border-gold/60"}`}>{fulfilment === "DELIVERY" ? "Cash on delivery" : "Pay at store"}</button>
          {shop?.onlineEnabled && <button type="button" aria-pressed={pay === "ONLINE"} onClick={() => setPay("ONLINE")} className={`rounded-full border px-5 py-2 text-sm ${pay === "ONLINE" ? "border-burgundy bg-burgundy text-cream" : "border-gold/60"}`}>Pay online (UPI / card)</button>}</div></fieldset>
      </div>
      <aside className="h-fit space-y-3 rounded-2xl border border-gold/40 bg-white/70 p-6">
        <h2 className="text-lg text-burgundy">Summary</h2>
        {items.map((i) => <p key={i.variantId} className="flex justify-between text-sm"><span>{i.name} · {i.label} × {i.qty}</span><span>{fmt(i.pricePaise * i.qty)}</span></p>)}
        <div className="flex gap-2"><input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className={inp} /><button type="button" onClick={applyCoupon} className="rounded-lg border border-burgundy px-3 text-sm text-burgundy">Apply</button></div>
        {couponMsg && <p className="text-xs text-stone-600">{couponMsg}</p>}
        <hr className="border-gold/30" />
        <p className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(total)}</span></p>
        {discount > 0 && <p className="flex justify-between text-sm text-green-700"><span>Discount</span><span>-{fmt(discount)}</span></p>}
        <p className="flex justify-between text-sm"><span>Delivery</span><span>{fee ? fmt(fee) : "Free"}</span></p>
        <p className="flex justify-between text-lg text-burgundy"><span>Total</span><span>{fmt(total - discount + fee)}</span></p>
        {shop && total < shop.minOrderPaise && <p className="text-xs text-red-700">Minimum order is {fmt(shop.minOrderPaise)}</p>}
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}{notice && <p role="status" className="text-sm text-amber-800">{notice}</p>}
        <button disabled={busy || shop?.paused} className="btn w-full disabled:opacity-50">{busy ? "Please wait…" : notice ? "Pay again" : pay === "ONLINE" ? "Place order & pay" : "Place order"}</button>
        <p className="text-xs text-stone-500">By ordering you accept our <Link href="/contact" className="underline">delivery &amp; cancellation policy</Link>.</p>
      </aside>
    </form>
  );
}
