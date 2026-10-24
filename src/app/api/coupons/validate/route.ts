import { z } from "zod";
import { db } from "@/lib/db";
import { handle, fail } from "@/lib/api";
import { rateLimit } from "@/lib/auth";
export const POST = (req: Request) => handle(async () => {
  if (!rateLimit("coupon:" + (req.headers.get("x-forwarded-for") ?? "ip"), 20)) throw fail("Too many attempts", 429);
  const { code, subtotalPaise } = z.object({ code: z.string().max(30), subtotalPaise: z.number().int().min(0) }).parse(await req.json());
  const c = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!c || !c.active || (c.expiresAt && c.expiresAt < new Date()) || subtotalPaise < c.minOrderPaise || (c.maxUses && c.used >= c.maxUses)) throw fail("Coupon is not valid for this order");
  return { discountPaise: Math.min(subtotalPaise, c.percentOff ? Math.floor((subtotalPaise * c.percentOff) / 100) : c.flatOffPaise ?? 0) }; // preview only; re-checked at checkout
});
