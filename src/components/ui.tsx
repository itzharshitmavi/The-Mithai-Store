"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Generic JSON form: number inputs -> numbers, lone checkbox -> boolean, grouped checkboxes (with value) -> array, empty -> omitted.
export function ApiForm({ action, children, submit = "Save", reset = false, className = "space-y-3" }: { action: string; children: React.ReactNode; submit?: string; reset?: boolean; className?: string }) {
  const router = useRouter(); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const form = e.currentTarget; const data: Record<string, any> = {};
    for (const el of Array.from(form.elements) as any[]) {
      if (!el.name) continue;
      if (el.type === "checkbox") { if (el.value !== "on") { data[el.name] ??= []; if (el.checked) data[el.name].push(el.value); } else data[el.name] = el.checked; }
      else if (el.type === "radio") { if (el.checked) data[el.name] = el.value; }
      else if (el.type === "file" || (el.value === "" && el.type === "number")) continue;
      else data[el.name] = el.type === "number" ? Number(el.value) : el.value;
    }
    const r = await fetch(action, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const d = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setMsg({ ok: false, t: d.error ?? "Failed" });
    setMsg({ ok: true, t: "Saved" }); if (reset) form.reset(); router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      <div className="flex items-center gap-3"><button disabled={busy} className="btn">{busy ? "Saving…" : submit}</button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.t}</span>}</div>
    </form>
  );
}

export function ActionButton({ url, body, label, confirmText, small = true }: { url: string; body?: object; label: string; confirmText?: string; small?: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function go() {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const d = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return alert(d.error ?? "Failed");
    router.refresh();
  }
  return <button onClick={go} disabled={busy} className={`rounded-full border border-burgundy px-3 ${small ? "py-1 text-xs" : "py-2 text-sm"} text-burgundy hover:bg-burgundy hover:text-cream disabled:opacity-50`}>{busy ? "…" : label}</button>;
}

export function ImageField({ initial }: { initial?: string }) {
  const [url, setUrl] = useState(initial ?? ""); const [err, setErr] = useState("");
  async function up(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setErr("");
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd }); const d = await r.json();
    r.ok ? setUrl(d.url) : setErr(d.error);
  }
  return (
    <div className="space-y-2"><input type="hidden" name="imageUrl" value={url} readOnly />
      {url && <img src={url} alt="" className="h-24 w-24 rounded-lg object-cover" />}
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={up} aria-label="Upload product image" className="text-sm" />
      {err && <p className="text-sm text-red-700">{err}</p>}</div>
  );
}
export const inputCls = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
