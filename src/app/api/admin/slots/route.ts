import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle, fail } from "@/lib/api";
import { getShop } from "@/lib/orders";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("GENERATE"), fromDate: z.string(), toDate: z.string(), type: z.enum(["DELIVERY", "PICKUP", "BOTH"]), times: z.string(), maxOrders: z.number().int().min(1), maxWorkload: z.number().int().min(1).optional() }),
  z.object({ action: z.literal("UPDATE"), id: z.string(), maxOrders: z.number().int().min(0), maxWorkload: z.number().int().min(0) }),
  z.object({ action: z.literal("TOGGLE"), id: z.string() })]);
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  const p = schema.parse(await req.json());
  if (p.action === "TOGGLE") { const s = await db.deliverySlot.findUniqueOrThrow({ where: { id: p.id } }); await db.deliverySlot.update({ where: { id: p.id }, data: { open: !s.open } }); return { ok: true }; }
  if (p.action === "UPDATE") { await db.deliverySlot.update({ where: { id: p.id }, data: { maxOrders: p.maxOrders, maxWorkload: p.maxWorkload } }); return { ok: true }; }
  const times = p.times.split(/[\n,]/).map((t) => t.trim()).filter(Boolean).map((t) => { const m = t.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/); if (!m) throw fail(`Bad time "${t}". Use 10:00-13:00`); return [m[1], m[2]]; });
  const from = new Date(p.fromDate), to = new Date(p.toDate);
  if (isNaN(+from) || isNaN(+to) || to < from) throw fail("Invalid date range");
  if ((+to - +from) / 86400000 > 31) throw fail("Create at most 32 days at a time");
  const shop = await getShop(); let created = 0;
  for (let d = new Date(from); d <= to; d = new Date(+d + 86400000)) {
    if (shop.holidays.includes(d.toISOString().slice(0, 10))) continue;
    for (const type of p.type === "BOTH" ? (["DELIVERY", "PICKUP"] as const) : [p.type]) for (const [s, e] of times) {
      if (await db.deliverySlot.findFirst({ where: { date: d, type, startTime: s } })) continue;
      await db.deliverySlot.create({ data: { date: d, type, startTime: s, endTime: e, maxOrders: p.maxOrders, maxWorkload: p.maxWorkload ?? 1000000 } }); created++;
    }
  }
  return { ok: true, created };
});
