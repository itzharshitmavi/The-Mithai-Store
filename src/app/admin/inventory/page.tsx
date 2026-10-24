import { db } from "@/lib/db";
import { getShop } from "@/lib/orders";
import { ActionButton, ApiForm, inputCls } from "@/components/ui";
import { Page, card } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Inventory() {
  const [variants, moves, shop] = await Promise.all([
    db.variant.findMany({ where: { active: true, product: { active: true } }, include: { product: true, allocation: true }, orderBy: [{ product: { name: "asc" } }, { grams: "asc" }] }),
    db.inventoryMovement.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { variant: { include: { product: true } } } }), getShop()]);
  return (
    <Page title="Online stock">
      <section className={`${card} flex flex-wrap items-center justify-between gap-3`}><p className="text-sm">Online ordering is <b className={shop.paused ? "text-red-700" : "text-green-700"}>{shop.paused ? "PAUSED" : "open"}</b>.</p>
        <ActionButton url="/api/admin/settings" body={{ scope: "shop", paused: !shop.paused }} label={shop.paused ? "Resume online orders" : "Pause online orders"} small={false} confirmText={shop.paused ? undefined : "Customers will not be able to place new orders. Continue?"} /></section>
      <p className="text-sm text-stone-600">This is only the quantity you give the website. Walk-in sales are not tracked here. Set it to what you can spare online, and add more when new batches are ready.</p>
      {variants.length === 0 && <p className="text-stone-500">Add products first.</p>}
      {variants.map((v) => { const a = v.allocation; return (
        <div key={v.id} className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-burgundy">{v.product.name} · {v.label}</p>
            <p className="text-sm">Online: <b>{a ? a.onlineQty - a.reserved : 0}</b> available <span className="text-stone-500">({a?.reserved ?? 0} held for unpaid orders)</span> · {a?.mode ?? "SOLD_OUT"}</p></div>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <ApiForm action="/api/admin/inventory" submit="Set total" className="flex items-end gap-2"><input type="hidden" name="variantId" value={v.id} /><input type="hidden" name="action" value="SET" /><input type="number" name="qty" min={0} required placeholder="Set qty" aria-label="Set online quantity" className={inputCls + " w-28"} /></ApiForm>
            <ApiForm action="/api/admin/inventory" submit="Add" reset className="flex items-end gap-2"><input type="hidden" name="variantId" value={v.id} /><input type="hidden" name="action" value="ADD" /><input type="number" name="qty" min={1} required placeholder="+ new batch" aria-label="Add prepared quantity" className={inputCls + " w-28"} /><input name="note" placeholder="Batch note" aria-label="Batch note" className={inputCls + " w-32"} /><input type="date" name="bestBefore" aria-label="Best before" title="Best before" className={inputCls + " w-36"} /></ApiForm>
            <div className="flex gap-2">{(["NORMAL", "LIMITED", "SOLD_OUT"] as const).map((m) => <ActionButton key={m} url="/api/admin/inventory" body={{ variantId: v.id, action: "MODE", mode: m }} label={m === "SOLD_OUT" ? "Sold out" : m === "LIMITED" ? "Limited" : "Normal"} />)}</div></div>
        </div>); })}
      <section><h2 className="mb-2 text-xl text-burgundy">Recent changes</h2>
        <ul className={`${card} divide-y divide-gold/20 text-sm`}>{moves.map((m) => <li key={m.id} className="flex justify-between py-1.5"><span>{m.variant.product.name} · {m.variant.label} · {m.type.replace("_", " ").toLowerCase()}{m.note ? ` (${m.note})` : ""}{m.bestBefore ? ` · best before ${m.bestBefore.toLocaleDateString("en-IN")}` : ""}</span><span>{m.delta > 0 ? "+" : ""}{m.delta} · {m.createdAt.toLocaleString("en-IN")}</span></li>)}{moves.length === 0 && <li className="py-2 text-stone-500">Nothing yet.</li>}</ul></section>
    </Page>
  );
}
