import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getShop } from "@/lib/orders";
import AddToCart from "@/components/AddToCart";
import { ApiForm, inputCls } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [p, user, shop] = await Promise.all([db.product.findUnique({ where: { slug: params.slug }, include: { category: true,
    variants: { where: { active: true }, include: { allocation: true }, orderBy: { grams: "asc" } },
    reviews: { where: { approved: true }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 } } }), currentUser(), getShop()]);
  if (!p || !p.active || (p.festivalOnly && !shop.festival.active)) notFound();
  const avg = p.reviews.length ? p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length : 0;
  const variants = p.variants.map((v) => { const left = v.allocation ? Math.max(0, v.allocation.onlineQty - v.allocation.reserved) : 0;
    return { id: v.id, label: v.label, pricePaise: v.pricePaise, left, soldOut: !v.allocation || v.allocation.mode === "SOLD_OUT" || left <= 0, limited: v.allocation?.mode === "LIMITED" }; });
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 md:grid-cols-2">
      <div>{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full rounded-2xl object-cover" /> : <div className="aspect-square rounded-2xl bg-gold/10" />}</div>
      <div className="space-y-5">
        <Link href={`/products?category=${p.category.slug}`} className="text-xs uppercase tracking-widest text-gold">{p.category.name}</Link>
        <h1 className="text-4xl text-burgundy">{p.name}</h1>
        {avg > 0 && <p className="text-sm text-gold">{"★".repeat(Math.round(avg))} <span className="text-stone-500">({p.reviews.length})</span></p>}
        <p className="text-stone-700">{p.description}</p>
        <AddToCart name={p.name} variants={variants} />
      </div>
      <section className="md:col-span-2"><h2 className="mb-4 text-2xl text-burgundy">Customer reviews</h2>
        {p.reviews.length === 0 && <p className="text-stone-500">No reviews yet.</p>}
        <ul className="space-y-4">{p.reviews.map((r) => <li key={r.id} className="rounded-xl border border-gold/30 bg-white/60 p-4"><p className="text-sm text-gold">{"★".repeat(r.rating)}</p><p>{r.body}</p><p className="mt-1 text-xs text-stone-500">{r.user.name}</p></li>)}</ul>
        {user ? <div className="mt-6 max-w-md"><h3 className="mb-2 text-lg text-burgundy">Write a review</h3>
          <ApiForm action="/api/reviews" submit="Submit review" reset><input type="hidden" name="productId" value={p.id} />
            <input type="number" name="rating" min={1} max={5} required placeholder="Rating (1-5)" aria-label="Rating" className={inputCls} />
            <textarea name="body" required minLength={3} maxLength={600} placeholder="Your experience" aria-label="Review" className={inputCls} /></ApiForm>
          <p className="mt-2 text-xs text-stone-500">Only customers who received this sweet can review. Reviews appear after approval.</p></div>
          : <p className="mt-6 text-sm"><Link href="/login" className="underline">Sign in</Link> to write a review.</p>}
      </section>
    </div>
  );
}
