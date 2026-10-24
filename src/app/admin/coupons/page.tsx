import { db } from "@/lib/db";
import { fmt } from "@/lib/money";
import { ActionButton, ApiForm, inputCls } from "@/components/ui";
import { Page, Label, card, ownerOnly, NoAccess } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Coupons() {
  if (!(await ownerOnly())) return <NoAccess />;
  const coupons = await db.coupon.findMany({ orderBy: { code: "asc" } });
  return (
    <Page title="Coupons">
      <section className={card}><ApiForm action="/api/admin/coupons" submit="Create coupon" reset><input type="hidden" name="action" value="CREATE" />
        <div className="grid gap-3 sm:grid-cols-3"><Label t="Code"><input name="code" required className={inputCls + " uppercase"} /></Label>
          <Label t="% off"><input type="number" name="percentOff" min={1} max={100} className={inputCls} /></Label><Label t="or flat ₹ off"><input type="number" name="flatOffRupees" min={1} className={inputCls} /></Label>
          <Label t="Minimum order ₹"><input type="number" name="minOrderRupees" min={0} className={inputCls} /></Label><Label t="Max total uses"><input type="number" name="maxUses" min={1} className={inputCls} /></Label>
          <Label t="Expires on"><input type="date" name="expiresAt" className={inputCls} /></Label></div></ApiForm></section>
      {coupons.length === 0 && <p className="text-stone-500">No coupons yet.</p>}
      {coupons.map((c) => <div key={c.id} className={`${card} flex flex-wrap items-center justify-between gap-2 text-sm ${c.active ? "" : "opacity-60"}`}>
        <span><b>{c.code}</b> · {c.percentOff ? `${c.percentOff}% off` : `${fmt(c.flatOffPaise ?? 0)} off`}{c.minOrderPaise ? ` over ${fmt(c.minOrderPaise)}` : ""}</span>
        <span>{c.used}{c.maxUses ? `/${c.maxUses}` : ""} used{c.expiresAt ? ` · until ${c.expiresAt.toLocaleDateString("en-IN")}` : ""}</span>
        <ActionButton url="/api/admin/coupons" body={{ action: "TOGGLE", id: c.id }} label={c.active ? "Disable" : "Enable"} /></div>)}
    </Page>
  );
}
