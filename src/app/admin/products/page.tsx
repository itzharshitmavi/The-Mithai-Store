import { db } from "@/lib/db";
import { ApiForm, ImageField, inputCls } from "@/components/ui";
import { Page, Label, card } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Products() {
  const [cats, products] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), db.product.findMany({ orderBy: { name: "asc" }, include: { variants: { where: { active: true }, orderBy: { grams: "asc" } } } })]);
  const form = (p?: (typeof products)[number]) => (
    <ApiForm action="/api/admin/products" submit={p ? "Save changes" : "Add product"} reset={!p}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <Label t="Name"><input name="name" required defaultValue={p?.name} className={inputCls} /></Label>
      <Label t="Description"><textarea name="description" required defaultValue={p?.description} className={inputCls} /></Label>
      <Label t="Category"><select name="categoryId" required defaultValue={p?.categoryId} className={inputCls}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Label>
      <Label t="Weights and prices (one per line: label|grams|price in ₹)"><textarea name="variants" required rows={3} defaultValue={p ? p.variants.map((v) => `${v.label}|${v.grams}|${v.pricePaise / 100}`).join("\n") : "250 g|250|280\n500 g|500|540\n1 kg|1000|1050"} className={inputCls + " font-mono"} /></Label>
      <Label t="Photo"><ImageField initial={p?.imageUrl ?? undefined} /></Label>
      <Label t="Preparation workload per kg (for slot capacity)"><input type="number" name="prepWorkload" min={1} defaultValue={p?.prepWorkload ?? 1} className={inputCls} /></Label>
      <div className="flex flex-wrap gap-4 text-sm">
        <label><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Visible</label>
        <label><input type="checkbox" name="isGiftBox" defaultChecked={p?.isGiftBox} /> Gift box</label>
        <label><input type="checkbox" name="festivalOnly" defaultChecked={p?.festivalOnly} /> Festival only</label></div>
    </ApiForm>);
  return (
    <Page title="Products">
      <section className={card}><h2 className="mb-3 text-xl text-burgundy">Categories</h2>
        <p className="mb-3 text-sm text-stone-600">{cats.map((c) => c.name + (c.isFestival ? " (festival)" : "")).join(" · ") || "No categories yet. Add one to start."}</p>
        <ApiForm action="/api/admin/categories" submit="Add category" reset className="flex flex-wrap items-end gap-3"><Label t="Name"><input name="name" required className={inputCls} /></Label>
          <label className="pb-2 text-sm"><input type="checkbox" name="isFestival" /> Festival collection</label></ApiForm></section>
      <section className={card}><h2 className="mb-3 text-xl text-burgundy">Add product</h2>{cats.length ? form() : <p>Add a category first.</p>}</section>
      {products.map((p) => <details key={p.id} className={card}><summary className="cursor-pointer text-burgundy">{p.name} {!p.active && <em className="text-xs text-stone-500">(hidden)</em>} <span className="text-xs text-stone-500">{p.variants.map((v) => v.label).join(", ")}</span></summary><div className="mt-4">{form(p)}</div></details>)}
      <p className="text-xs text-stone-500">New weights start with 0 online stock. Set quantity on the Stock page. Price changes apply to new orders only; past orders keep their original price.</p>
    </Page>
  );
}
