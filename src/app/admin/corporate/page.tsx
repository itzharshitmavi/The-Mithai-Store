import { db } from "@/lib/db";
import { ActionButton } from "@/components/ui";
import { Page, card } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Corporate() {
  const rows = await db.corporateEnquiry.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <Page title="Corporate enquiries">{rows.length === 0 && <p className="text-stone-500">No enquiries yet.</p>}
      {rows.map((r) => <div key={r.id} className={`${card} space-y-1 text-sm`}><p className="flex justify-between"><b className="text-burgundy">{r.company} · {r.name}</b><span>{r.status.toLowerCase()}</span></p>
        <p><a href={`tel:${r.phone}`} className="underline">{r.phone}</a>{r.email ? ` · ${r.email}` : ""} · {r.createdAt.toLocaleDateString("en-IN")}</p><p>{r.details}</p>
        <div className="flex gap-2 pt-1">{(["CONTACTED", "DONE"] as const).map((s) => <ActionButton key={s} url="/api/admin/corporate" body={{ id: r.id, status: s }} label={s === "CONTACTED" ? "Mark contacted" : "Mark done"} />)}</div></div>)}</Page>
  );
}
