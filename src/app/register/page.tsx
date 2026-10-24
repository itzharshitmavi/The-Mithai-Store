"use client";
import { useState } from "react";
export default function Register() {
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const o: Record<string, string> = {}; new FormData(e.currentTarget).forEach((v, k) => { if (v) o[k] = String(v); });
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o) });
    const d = await r.json(); setBusy(false);
    r.ok ? (location.href = "/") : setErr(d.error);
  }
  const c = "w-full rounded-lg border border-stone-300 px-4 py-3";
  return (
    <form onSubmit={submit} className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-gold/40 bg-white/70 p-8">
      <h1 className="text-2xl text-burgundy">Create account</h1>
      <input name="name" required placeholder="Full name" aria-label="Full name" className={c} />
      <input name="email" type="email" required placeholder="Email" aria-label="Email" className={c} />
      <input name="phone" inputMode="numeric" placeholder="Mobile (optional)" aria-label="Mobile" className={c} />
      <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" aria-label="Password" className={c} />
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn w-full">{busy ? "Creating…" : "Create account"}</button>
    </form>
  );
}
