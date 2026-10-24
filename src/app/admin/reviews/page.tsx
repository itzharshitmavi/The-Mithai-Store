import { db } from "@/lib/db";
import { ActionButton } from "@/components/ui";
import { Page, card } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Reviews() {
  const rs = await db.review.findMany({ where: { approved: false }, include: { user: true, product: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <Page title="Reviews to approve">{rs.length === 0 && <p className="text-stone-500">No reviews waiting.</p>}
      {rs.map((r) => <div key={r.id} className={card}><p className="text-sm text-gold">{"★".repeat(r.rating)} <span className="text-stone-600">{r.product.name} · {r.user.name}</span></p><p className="my-2">{r.body}</p>
        <div className="flex gap-2"><ActionButton url="/api/admin/reviews" body={{ id: r.id, action: "APPROVE" }} label="Approve" /><ActionButton url="/api/admin/reviews" body={{ id: r.id, action: "DELETE" }} label="Delete" confirmText="Delete this review?" /></div></div>)}</Page>
  );
}
