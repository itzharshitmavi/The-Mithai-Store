import Link from "next/link";
import { db } from "@/lib/db";
import { getShop } from "@/lib/orders";
import { fmt } from "@/lib/money";
export const dynamic = "force-dynamic";
export default async function Home() {
  const shop = await getShop();
  const [cats, featured] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ where: { active: true, ...(shop.festival.active ? {} : { festivalOnly: false }) }, include: { variants: { where: { active: true }, orderBy: { grams: "asc" } } }, take: 6, orderBy: { id: "desc" } }),
  ]);
  const festCats = cats.filter((c) => c.isFestival);
  return (
    <div>
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gold">Handcrafted, made fresh</p>
        <h1 className="text-4xl leading-tight text-burgundy md:text-6xl">Sweets for every celebration</h1>
        <div className="gold-rule my-8" />
        <div className="flex flex-wrap justify-center gap-3"><Link href="/products" className="btn">Explore our sweets</Link><Link href="/products?gift=1" className="rounded-full border border-burgundy px-6 py-3 text-sm text-burgundy">Gift boxes</Link></div>
      </section>
      {festCats.length > 0 && (shop.festival.active || true) && (
        <section className="mx-auto max-w-6xl px-5 pb-16"><h2 className="mb-6 text-center text-2xl text-burgundy">Festival collections</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{festCats.map((c) => <Link key={c.id} href={`/products?category=${c.slug}`} className="rounded-2xl border border-gold bg-burgundy p-8 text-center text-cream">{c.name}</Link>)}</div></section>
      )}
      <section className="mx-auto max-w-6xl px-5"><h2 className="mb-6 text-2xl text-burgundy">Our favourites</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <Link key={p.id} href={`/products/${p.slug}`} className="overflow-hidden rounded-2xl border border-gold/30 bg-white/70 transition hover:shadow-lg">
            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-52 w-full object-cover" /> : <div className="h-52 bg-gold/10" />}
            <div className="p-5"><h3 className="text-lg text-burgundy">{p.name}</h3><p className="text-sm text-stone-600">from {p.variants[0] ? fmt(p.variants[0].pricePaise) : "-"}</p></div></Link>)}
          {featured.length === 0 && <p className="col-span-full text-center text-stone-500">Our menu is being prepared. Please check back soon.</p>}
        </div></section>
      <section className="mx-auto mt-20 max-w-3xl px-5 text-center"><h2 className="text-2xl text-burgundy">Visit us</h2><div className="gold-rule my-4" />
        <p>{shop.address || "Shop address coming soon"}</p><p className="text-sm text-stone-600">{shop.hours}</p>
        {shop.mapUrl && <a href={shop.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-burgundy underline">Open in Maps</a>}</section>
    </div>
  );
}
