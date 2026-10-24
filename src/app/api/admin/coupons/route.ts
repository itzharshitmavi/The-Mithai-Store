import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle, fail } from "@/lib/api";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("CREATE"), code: z.string().min(3).max(30), percentOff: z.number().int().min(1).max(100).optional(), flatOffRupees: z.number().min(1).optional(),
    minOrderRupees: z.number().min(0).optional(), maxUses: z.number().int().min(1).optional(), expiresAt: z.string().optional() }),
  z.object({ action: z.literal("TOGGLE"), id: z.string() })]);
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN");
  const p = schema.parse(await req.json());
  if (p.action === "TOGGLE") { const c = await db.coupon.findUniqueOrThrow({ where: { id: p.id } }); await db.coupon.update({ where: { id: p.id }, data: { active: !c.active } }); return { ok: true }; }
  if (!p.percentOff && !p.flatOffRupees) throw fail("Enter a percentage or a flat amount");
  if (p.percentOff && p.flatOffRupees) throw fail("Use either percentage or flat amount, not both");
  try {
    await db.coupon.create({ data: { code: p.code.toUpperCase().replace(/\s/g, ""), percentOff: p.percentOff, flatOffPaise: p.flatOffRupees ? Math.round(p.flatOffRupees * 100) : undefined,
      minOrderPaise: Math.round((p.minOrderRupees ?? 0) * 100), maxUses: p.maxUses, expiresAt: p.expiresAt ? new Date(p.expiresAt + "T23:59:59+05:30") : undefined } });
  } catch (e: any) { if (e.code === "P2002") throw fail("That coupon code already exists"); throw e; }
  return { ok: true };
});
