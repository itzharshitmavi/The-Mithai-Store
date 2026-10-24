import "./globals.css";
import Link from "next/link";
import { CartProvider, CartLink } from "@/lib/cart";
import { ActionButton } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getShop } from "@/lib/orders";
export const metadata = { title: "Mithai House | Handcrafted Indian Sweets", description: "Fresh traditional sweets, festival boxes and gift hampers." };
export const dynamic = "force-dynamic";
export default async function Root({ children }: { children: React.ReactNode }) {
  const [user, shop] = await Promise.all([currentUser(), getShop()]);
  const wa = shop.whatsapp.replace(/\D/g, "");
  return (
    <html lang="en"><body className="font-serif"><CartProvider>
      <header className="sticky top-0 z-10 border-b border-gold/30 bg-cream/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="text-2xl tracking-wide text-burgundy">{shop.name}</Link>
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <Link href="/products">Sweets</Link><Link href="/track">Track order</Link><Link href="/contact">Contact</Link>
            {user ? <>{user.role !== "CUSTOMER" ? <Link href="/admin">Admin</Link> : <Link href="/orders">My orders</Link>}<ActionButton url="/api/auth/logout" label="Sign out" /></> : <Link href="/login">Sign in</Link>}
            <CartLink />
          </div>
        </nav>
        {shop.festival.active && <div className="bg-burgundy py-1.5 text-center text-xs text-cream">{shop.festival.name || "Festival"} ordering is open{shop.festival.advanceDeadline ? ` · order before ${new Date(shop.festival.advanceDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</div>}
        {shop.paused && <div className="bg-amber-100 py-1.5 text-center text-xs text-amber-900">Online ordering is temporarily paused. Please check back soon or call us.</div>}
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-gold/30 px-5 py-10 text-center text-sm text-stone-600">
        <p>{shop.address}{shop.hours ? ` · ${shop.hours}` : ""}</p>
        <p className="mt-2"><Link href="/contact" className="underline">Delivery &amp; cancellation policy</Link> · <Link href="/corporate" className="underline">Corporate &amp; bulk orders</Link></p>
      </footer>
      {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Hello, I have a question about my order")}`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 rounded-full bg-green-600 px-5 py-3 text-sm text-white shadow-lg">WhatsApp</a>}
    </CartProvider></body></html>
  );
}
