"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/money";
type V = { id: string; label: string; pricePaise: number; left: number; soldOut: boolean; limited: boolean };
export default function AddToCart({ name, variants }: { name: string; variants: V[] }) {
  const { add } = useCart();
  const first = variants.find((v) => !v.soldOut) ?? variants[0];
  const [vid, setVid] = useState(first?.id); const [qty, setQty] = useState(1); const [done, setDone] = useState(false);
  const v = variants.find((x) => x.id === vid);
  if (!v) return <p className="text-burgundy">Currently unavailable.</p>;
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Weight" className="flex flex-wrap gap-2">
        {variants.map((x) => <button key={x.id} role="radio" aria-checked={x.id === vid} disabled={x.soldOut} onClick={() => { setVid(x.id); setQty(1); setDone(false); }}
          className={`rounded-full border px-4 py-2 text-sm ${x.id === vid ? "border-burgundy bg-burgundy text-cream" : "border-gold/60"} disabled:opacity-40 disabled:line-through`}>{x.label} · {fmt(x.pricePaise)}</button>)}
      </div>
      {v.soldOut ? <p className="text-burgundy">Sold out online. Visit the shop or check back later.</p> : <>
        {(v.limited || v.left <= 5) && <p className="text-sm text-gold">Only {v.left} left online</p>}
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-full border border-gold/60"><button aria-label="Decrease" className="px-4 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="w-8 text-center">{qty}</span><button aria-label="Increase" className="px-4 py-2" onClick={() => setQty(Math.min(v.left, qty + 1))}>+</button></div>
          <button className="btn" onClick={() => { add({ variantId: v.id, name, label: v.label, pricePaise: v.pricePaise, qty }); setDone(true); }}>Add to cart</button></div>
        {done && <p role="status" className="text-sm text-green-700">Added. <a href="/cart" className="underline">View cart</a></p>}</>}
    </div>
  );
}
