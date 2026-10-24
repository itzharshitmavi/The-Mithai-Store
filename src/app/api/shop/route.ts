import { NextResponse } from "next/server";
import { getShop } from "@/lib/orders";
export async function GET() {
  const s = await getShop();
  return NextResponse.json({ name: s.name, phone: s.phone, paused: s.paused, minOrderPaise: s.minOrderPaise, deliveryFeePaise: s.deliveryFeePaise,
    freeDeliveryAbovePaise: s.freeDeliveryAbovePaise, onlineEnabled: !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET && !!process.env.RAZORPAY_WEBHOOK_SECRET, festival: { active: s.festival.active, name: s.festival.name } });
}
