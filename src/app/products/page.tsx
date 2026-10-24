import Link from "next/link";
import { db } from "@/lib/db";
import { getShop } from "@/lib/orders";
import { fmt } from "@/lib/money";
export const dynamic = "force-dynamic";
export default async function Products({ searchParams }: { searchParams: { category?: string; q?: string; gift?: string } }) {
  const shop = await getShop();
  const [cats, products] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), db.product.findMany({
    where: { active: true, ...(shop.festival.active ? {} : { festivalOnly: false }), ...(searchParams.gift ? { isGiftBox: true } : {}),
      ...(searchParams.category ? { category: { slug: searchParams.category } } : {}), ...(searchParams.q ? { name: { contains: searchParams.q, mode: "insensitive" } } : {}) },
    include: { variants: { where: { active: true }, include: { allocation: true }, orderBy: { grams: "asc" } } } })]);
  const chip = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm ${on ? "bg-burgundy text-cream border-burgundy" : "border-gold/50"}`;
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <form className="mb-6"><input name="q" defaultValue={searchParams.q} placeholder="Search sweets…" aria-label="Search sweets" className="w-full rounded-full border border-gold/50 bg-white px-5 py-3 focus:outline-none focus:ring-2 focus:ring-gold" /></form>
      <div className="mb-10 flex flex-wrap gap-2"><Link href="/products" className={chip(!searchParams.category && !searchParams.gift)}>All</Link>
        <Link href="/products?gift=1" className={chip(!!searchParams.gift)}>Gift boxes</Link>
        {cats.map((c) => <Link key={c.id} href={`/products?category=${c.slug}`} className={chip(searchParams.category === c.slug)}>{c.name}</Link>)}</div>
      {products.length === 0 && <p className="text-center text-stone-500">No sweets found. Try a different search.</p>}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const avail = p.variants.filter((v) => v.allocation && v.allocation.mode !== "SOLD_OUT" && v.allocation.onlineQty - v.allocation.reserved > 0);
          return (
            <Link key={p.id} href={`/products/${p.slug}`} className="overflow-hidden rounded-2xl border border-gold/30 bg-white/70 transition hover:shadow-lg">
              {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-52 w-full object-cover" /> : <div className="h-52 bg-gold/10" />}
              <div className="p-5"><h2 className="text-xl text-burgundy">{p.name}</h2>
                <p className="mt-1 text-sm text-stone-600">{p.variants[0] ? `from ${fmt(p.variants[0].pricePaise)}` : ""}</p>
                <p className={`mt-2 text-xs ${avail.length ? "text-gold" : "text-burgundy"}`}>{avail.length === 0 ? "Sold out online" : avail.some((v) => v.allocation!.mode === "LIMITED") ? "Limited stock" : ""}</p></div>
            </Link>);
        })}
      </div>
    </div>
  );
}
