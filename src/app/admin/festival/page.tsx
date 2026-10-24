import { db } from "@/lib/db";
import { getShop } from "@/lib/orders";
import { ApiForm, inputCls } from "@/components/ui";
import { Page, Label, card, ownerOnly, NoAccess } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Festival() {
  if (!(await ownerOnly())) return <NoAccess />;
  const [shop, products] = await Promise.all([getShop(), db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } })]);
  const f = shop.festival;
  return (
    <Page title="Festival mode">
      <p className="text-sm text-stone-600">Turn this on for Diwali, Holi, Raksha Bandhan and similar rushes. When on, only the products you tick can be ordered, and the limits below apply. Slot capacity is set on the Slots page. To stop taking orders immediately, use Pause on the Stock page.</p>
      <section className={card}><ApiForm action="/api/admin/settings" submit="Save festival settings"><input type="hidden" name="scope" value="festival" />
        <label className="flex items-center gap-2 text-lg"><input type="checkbox" name="active" defaultChecked={f.active} /> Festival mode is ON</label>
        <div className="grid gap-3 sm:grid-cols-2"><Label t="Festival name"><input name="name" defaultValue={f.name} className={inputCls} placeholder="Diwali 2026" /></Label>
          <Label t="Max online orders per day (0 = no limit)"><input type="number" name="dailyOrderLimit" min={0} defaultValue={f.dailyOrderLimit} className={inputCls} /></Label>
          <Label t="Preparation lead time (hours)"><input type="number" name="leadHours" min={0} defaultValue={f.leadHours} className={inputCls} /></Label>
          <Label t="Stop taking orders after (IST)"><input type="datetime-local" name="advanceDeadline" defaultValue={f.advanceDeadline?.slice(0, 16)} className={inputCls} /></Label></div>
        <fieldset><legend className="mb-2 text-sm text-stone-600">Products available during festival (none ticked = all)</legend>
          <div className="grid gap-1 sm:grid-cols-2">{products.map((p) => <label key={p.id} className="text-sm"><input type="checkbox" name="productIds" value={p.id} defaultChecked={f.productIds.includes(p.id)} /> {p.name}{p.festivalOnly ? " ★" : ""}</label>)}</div></fieldset></ApiForm></section>
    </Page>
  );
}
