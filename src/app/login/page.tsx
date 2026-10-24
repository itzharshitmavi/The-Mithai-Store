"use client";
import Link from "next/link";
import { useState } from "react";
export default function Login() {
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(f)) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setErr(d.error);
    const next = new URLSearchParams(location.search).get("next");
    location.href = next && next.startsWith("/") ? next : d.role === "CUSTOMER" ? "/" : "/admin";
  }
  return (
    <form onSubmit={submit} className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-gold/40 bg-white/70 p-8">
      <h1 className="text-2xl text-burgundy">Sign in</h1>
      <input name="email" type="email" required placeholder="Email" aria-label="Email" className="w-full rounded-lg border border-stone-300 px-4 py-3" />
      <input name="password" type="password" required placeholder="Password" aria-label="Password" className="w-full rounded-lg border border-stone-300 px-4 py-3" />
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn w-full">{busy ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm">New here? <Link href="/register" className="underline">Create an account</Link></p>
    </form>
  );
}
