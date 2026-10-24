"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/money";
export default function Cart() {
  const { items, total, setQty } = useCart();
  if (items.length === 0) return <div className="mx-auto max-w-lg px-5 py-24 text-center"><h1 className="text-3xl text-burgundy">Your cart is empty</h1><Link href="/products" className="btn mt-6">Browse sweets</Link></div>;
  return (
    <div className="mx-auto max-w-2xl px-5 py-12"><h1 className="mb-6 text-3xl text-burgundy">Your cart</h1>
      <ul className="divide-y divide-gold/20 rounded-2xl border border-gold/30 bg-white/70">
        {items.map((i) => <li key={i.variantId} className="flex items-center justify-between gap-3 p-4"><div><p className="text-burgundy">{i.name}</p><p className="text-sm text-stone-600">{i.label} · {fmt(i.pricePaise)}</p></div>
          <div className="flex items-center gap-3"><div className="flex items-center rounded-full border border-gold/60"><button aria-label="Decrease" className="px-3 py-1" onClick={() => setQty(i.variantId, i.qty - 1)}>−</button><span>{i.qty}</span><button aria-label="Increase" className="px-3 py-1" onClick={() => setQty(i.variantId, i.qty + 1)}>+</button></div>
            <span className="w-20 text-right">{fmt(i.pricePaise * i.qty)}</span></div></li>)}
      </ul>
      <p className="mt-6 flex justify-between text-lg"><span>Subtotal</span><span>{fmt(total)}</span></p>
      <p className="mt-1 text-xs text-stone-500">Prices and availability are confirmed again at checkout. Delivery charges and coupons are applied there.</p>
      <Link href="/checkout" className="btn mt-6 w-full text-center">Proceed to checkout</Link>
    </div>
  );
}
