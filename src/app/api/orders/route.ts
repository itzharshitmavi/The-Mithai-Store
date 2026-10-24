import { NextResponse } from "next/server";
import { ZodError } from "zod";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { currentUser, rateLimit } from "@/lib/auth";
import { createOrder, OrderError } from "@/lib/orders";
import { queueEmail } from "@/lib/notify";

export async function POST(req: Request) {
  if (!rateLimit("order:" + (req.headers.get("x-forwarded-for") ?? "ip"), 8)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const user = await currentUser();
    const order = await createOrder(await req.json(), user?.id ?? null);
    let razorpay: { orderId: string; keyId: string; amount: number } | null = null;
    if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PENDING" && !order.stockReleased) {
      const existing = await db.payment.findFirst({ where: { orderId: order.id } });
      let rzpOrderId = existing?.providerOrderId;
      if (!rzpOrderId) {
        const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
        const r = await rz.orders.create({ amount: order.totalPaise, currency: "INR", receipt: `ord_${order.number}` });
        rzpOrderId = r.id;
        await db.payment.create({ data: { orderId: order.id, providerOrderId: r.id, amountPaise: order.totalPaise } });
      }
      razorpay = { orderId: rzpOrderId!, keyId: process.env.RAZORPAY_KEY_ID!, amount: order.totalPaise };
    } else if (order.paymentMethod === "COD") {
      const to = user?.email ?? order.guestEmail;
      if (to) await queueEmail(order.id, to, `Order #${order.number} received`, `Thank you ${order.contactName}! We have received your order #${order.number} (₹${order.totalPaise / 100}, pay on ${order.fulfilment === "DELIVERY" ? "delivery" : "pickup"}).`);
    }
    if (user && order.fulfilment === "DELIVERY" && order.addressLine && order.pincode) {
      const have = await db.address.findFirst({ where: { userId: user.id, line1: order.addressLine, pincode: order.pincode } });
      if (!have) await db.address.create({ data: { userId: user.id, line1: order.addressLine, city: "", pincode: order.pincode, phone: order.contactPhone } });
    }
    return NextResponse.json({ orderId: order.id, number: order.number, razorpay });
  } catch (e: any) {
    if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Could not place order. Please try again." }, { status: 500 });
  }
}
