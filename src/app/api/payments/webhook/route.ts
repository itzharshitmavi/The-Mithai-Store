import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { queueEmail } from "@/lib/notify";

export async function POST(req: Request) {
  const raw = await req.text(); // raw body is required for signature check
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET ?? "").update(raw).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  const eventId = req.headers.get("x-razorpay-event-id");
  const evt = JSON.parse(raw);
  if (!eventId) return NextResponse.json({ error: "missing event id" }, { status: 400 });
  try { await db.webhookEvent.create({ data: { id: eventId, type: evt.event } }); }
  catch { return NextResponse.json({ ok: true, duplicate: true }); } // already processed

  try {
    const pay = evt.payload?.payment?.entity;
    if ((evt.event === "payment.captured" || evt.event === "order.paid") && pay) {
      const order = await markPaid(pay.order_id, pay.id, pay.amount);
      const to = order.guestEmail ?? (order.userId ? (await db.user.findUnique({ where: { id: order.userId } }))?.email : null);
      if (to && order.paymentStatus === "PAID") await queueEmail(order.id, to, `Payment received for order #${order.number}`, `We received your payment of ₹${order.totalPaise / 100}. Your order is confirmed.`);
    } else if (evt.event === "payment.failed" && pay) {
      await db.payment.updateMany({ where: { providerOrderId: pay.order_id, status: "PENDING" }, data: { status: "FAILED" } });
    }
  } catch (e) {
    await db.webhookEvent.delete({ where: { id: eventId } }).catch(() => {}); // let Razorpay retry
    console.error(e);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
