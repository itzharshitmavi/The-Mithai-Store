"use client";
import { createContext, useContext, useEffect, useState } from "react";
export type CartItem = { variantId: string; name: string; label: string; pricePaise: number; qty: number };
type C = { items: CartItem[]; count: number; total: number; add: (i: CartItem) => void; setQty: (id: string, q: number) => void; clear: () => void };
const Ctx = createContext<C>(null as unknown as C);
export const useCart = () => useContext(Ctx);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, set] = useState<CartItem[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { try { set(JSON.parse(localStorage.getItem("cart") || "[]")); } catch {} setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem("cart", JSON.stringify(items)); }, [items, ready]);
  const add = (i: CartItem) => set((p) => p.some((x) => x.variantId === i.variantId) ? p.map((x) => x.variantId === i.variantId ? { ...x, qty: Math.min(50, x.qty + i.qty) } : x) : [...p, i]);
  const setQty = (id: string, q: number) => set((p) => q <= 0 ? p.filter((x) => x.variantId !== id) : p.map((x) => x.variantId === id ? { ...x, qty: Math.min(50, q) } : x));
  return <Ctx.Provider value={{ items, count: items.reduce((a, b) => a + b.qty, 0), total: items.reduce((a, b) => a + b.qty * b.pricePaise, 0), add, setQty, clear: () => set([]) }}>{children}</Ctx.Provider>;
}
export function CartLink() { const { count } = useCart(); return <a href="/cart" className="relative">Cart{count > 0 && <span className="ml-1 rounded-full bg-burgundy px-2 py-0.5 text-xs text-cream">{count}</span>}</a>; }
