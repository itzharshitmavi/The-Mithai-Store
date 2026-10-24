import { db } from "@/lib/db";
import { ActionButton, ApiForm, inputCls } from "@/components/ui";
import { Page, Label, card } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Slots() {
  const from = new Date(Date.now() + 19800000); from.setUTCHours(0, 0, 0, 0);
  const slots = await db.deliverySlot.findMany({ where: { date: { gte: from } }, orderBy: [{ date: "asc" }, { type: "asc" }, { startTime: "asc" }], take: 200 });
  return (
    <Page title="Delivery & pickup slots">
      <section className={card}><h2 className="mb-3 text-xl text-burgundy">Create slots</h2>
        <ApiForm action="/api/admin/slots" submit="Create slots"><input type="hidden" name="action" value="GENERATE" />
          <div className="grid gap-3 sm:grid-cols-2"><Label t="From date"><input type="date" name="fromDate" required className={inputCls} /></Label><Label t="To date"><input type="date" name="toDate" required className={inputCls} /></Label>
            <Label t="For"><select name="type" className={inputCls}><option value="BOTH">Delivery and pickup</option><option value="DELIVERY">Delivery</option><option value="PICKUP">Pickup</option></select></Label>
            <Label t="Time windows (one per line, e.g. 10:00-13:00)"><textarea name="times" required rows={3} defaultValue={"10:00-13:00\n13:00-16:00\n16:00-19:00"} className={inputCls} /></Label>
            <Label t="Max orders per slot"><input type="number" name="maxOrders" min={1} required defaultValue={10} className={inputCls} /></Label>
            <Label t="Max workload per slot (kg of preparation, optional)"><input type="number" name="maxWorkload" min={1} className={inputCls} /></Label></div></ApiForm></section>
      {slots.length === 0 && <p className="text-stone-500">No upcoming slots. Customers cannot order until you create some.</p>}
      <div className="space-y-2">{slots.map((s) => (
        <div key={s.id} className={`${card} flex flex-wrap items-center justify-between gap-3 text-sm ${s.open ? "" : "opacity-60"}`}>
          <span>{s.date.toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" })} · {s.type === "DELIVERY" ? "Delivery" : "Pickup"} · {s.startTime}–{s.endTime}</span>
          <span>{s.bookedOrders}/{s.maxOrders} orders · {s.bookedWorkload}/{s.maxWorkload >= 1000000 ? "∞" : s.maxWorkload} load</span>
          <div className="flex items-center gap-2"><ApiForm action="/api/admin/slots" submit="Update" className="flex items-center gap-2"><input type="hidden" name="action" value="UPDATE" /><input type="hidden" name="id" value={s.id} />
            <input type="number" name="maxOrders" min={0} defaultValue={s.maxOrders} aria-label="Max orders" className={inputCls + " w-20"} /><input type="number" name="maxWorkload" min={0} defaultValue={s.maxWorkload >= 1000000 ? 100000 : s.maxWorkload} aria-label="Max workload" className={inputCls + " w-24"} /></ApiForm>
            <ActionButton url="/api/admin/slots" body={{ action: "TOGGLE", id: s.id }} label={s.open ? "Close" : "Reopen"} /></div></div>))}</div>
    </Page>
  );
}
