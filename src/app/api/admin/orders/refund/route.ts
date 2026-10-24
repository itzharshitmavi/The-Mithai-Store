import { z } from "zod";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle, fail } from "@/lib/api";
import { queueEmail } from "@/lib/notify";
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN");
  const { orderId, manual } = z.object({ orderId: z.string(), manual: z.boolean().optional() }).parse(await req.json());
  const o = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true, user: true } });
  if (o.paymentStatus !== "REFUND_PENDING") throw fail("No refund is pending for this order", 409);
  const pay = o.payments.find((x) => x.status === "PAID" && x.providerPaymentId);
  if (!manual) {
    if (!pay || !process.env.RAZORPAY_KEY_ID) throw fail("Cannot refund automatically. Refund in Razorpay, then use 'Mark refunded'.");
    try { await new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET! }).payments.refund(pay.providerPaymentId!, { amount: pay.amountPaise }); }
    catch (e: any) { throw fail("Razorpay refund failed: " + (e?.error?.description ?? "unknown error"), 502); }
  }
  await db.$transaction([db.order.update({ where: { id: o.id }, data: { paymentStatus: "REFUNDED" } }), ...(pay ? [db.payment.update({ where: { id: pay.id }, data: { status: "REFUNDED" } })] : [])]);
  const to = o.user?.email ?? o.guestEmail;
  if (to) await queueEmail(o.id, to, `Refund processed for order #${o.number}`, `Your refund of ₹${o.totalPaise / 100} for order #${o.number} has been issued. It may take 5-7 working days to appear.`);
  return { ok: true };
});
