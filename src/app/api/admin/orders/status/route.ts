import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { releaseOrder } from "@/lib/orders";
import { queueEmail } from "@/lib/notify";
import { FLOW, MSG } from "@/lib/flow";
import { handle, fail } from "@/lib/api";

const schema = z.object({ orderId: z.string(), status: z.enum(["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REJECTED"]) });
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  const p = schema.parse(await req.json());
  const o = await db.order.findUniqueOrThrow({ where: { id: p.orderId }, include: { user: true } });
  if (!FLOW[o.status]?.includes(p.status)) throw fail(`Cannot move from ${o.status} to ${p.status}`, 409);
  const closing = p.status === "CANCELLED" || p.status === "REJECTED";
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: o.id }, data: { status: p.status, ...(closing && o.paymentStatus === "PAID" ? { paymentStatus: "REFUND_PENDING" } : {}),
      ...(p.status === "DELIVERED" && o.paymentMethod === "COD" ? { paymentStatus: "PAID" } : {}) } });
    if (closing) await releaseOrder(tx, o.id);
  });
  const to = o.user?.email ?? o.guestEmail;
  if (to) await queueEmail(o.id, to, `Order #${o.number} update`, `Hello ${o.contactName}, your order #${o.number} ${MSG[p.status]}.`);
  return { ok: true };
});
