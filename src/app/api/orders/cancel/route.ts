import { z } from "zod";
import { db } from "@/lib/db";
import { handle, fail } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { releaseOrder } from "@/lib/orders";
import { queueEmail } from "@/lib/notify";

export const POST = (req: Request) => handle(async () => {
  const { orderId, phone } = z.object({ orderId: z.string(), phone: z.string().optional() }).parse(await req.json());
  const user = await currentUser();
  const o = await db.order.findUnique({ where: { id: orderId }, include: { user: true } });
  const ok = o && ((user && (user.id === o.userId || user.role !== "CUSTOMER")) || (phone && phone === o.contactPhone));
  if (!o || !ok) throw fail("Order not found", 404);
  if (!["PLACED", "CONFIRMED"].includes(o.status)) throw fail("Your order is already being prepared and cannot be cancelled online. Please call the shop.", 409);
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: o.id }, data: { status: "CANCELLED", ...(o.paymentStatus === "PAID" ? { paymentStatus: "REFUND_PENDING" } : {}) } });
    await releaseOrder(tx, o.id);
  });
  const to = o.user?.email ?? o.guestEmail;
  if (to) await queueEmail(o.id, to, `Order #${o.number} cancelled`, `Your order #${o.number} has been cancelled.${o.paymentStatus === "PAID" ? " Your refund will be processed by the shop shortly." : ""}`);
  return { ok: true };
});
