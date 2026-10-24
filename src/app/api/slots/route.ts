import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expireReservations, getShop, slotStart } from "@/lib/orders";

export async function GET(req: Request) {
  const u = new URL(req.url); const date = u.searchParams.get("date"), type = u.searchParams.get("type");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || (type !== "DELIVERY" && type !== "PICKUP")) return NextResponse.json({ error: "date and type required" }, { status: 400 });
  await expireReservations();
  const shop = await getShop();
  if (shop.paused) return NextResponse.json({ message: "Online ordering is paused right now. Please try again later.", slots: [] });
  if (shop.holidays.includes(date)) return NextResponse.json({ message: "The shop is closed on this date.", slots: [] });
  const lead = Math.max(shop.leadHours, shop.festival.active ? shop.festival.leadHours : 0);
  const slots = await db.deliverySlot.findMany({ where: { date: new Date(date), type, open: true }, orderBy: { startTime: "asc" } });
  const out = slots.map((s) => {
    const full = s.bookedOrders >= s.maxOrders || s.bookedWorkload >= s.maxWorkload;
    const soon = slotStart(s).getTime() - Date.now() < lead * 3600_000;
    return { id: s.id, start: s.startTime, end: s.endTime, available: !full && !soon, label: full ? "Full" : soon ? "Too soon" : undefined };
  });
  const msg = out.length === 0 ? "No slots are available on this date." : !out.some((s) => s.available) ? `No slots left. Same-day orders need ${lead} hours of preparation time.` : undefined;
  return NextResponse.json({ message: msg, slots: out });
}
