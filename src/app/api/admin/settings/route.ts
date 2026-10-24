import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle } from "@/lib/api";
const list = (s: string) => s.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
const shop = z.object({ scope: z.literal("shop"), name: z.string().max(80).optional(), phone: z.string().max(20).optional(), whatsapp: z.string().max(20).optional(), address: z.string().max(300).optional(),
  mapUrl: z.union([z.literal(""), z.string().url()]).optional(), hours: z.string().max(200).optional(), minOrderRupees: z.number().min(0).optional(), deliveryFeeRupees: z.number().min(0).optional(),
  freeDeliveryAboveRupees: z.number().min(0).optional(), pincodes: z.string().optional(), holidays: z.string().optional(), leadHours: z.number().min(0).max(240).optional(),
  reservationMinutes: z.number().int().min(5).max(120).optional(), paused: z.boolean().optional(), deliveryPolicy: z.string().max(2000).optional(), cancellationPolicy: z.string().max(2000).optional() });
const fest = z.object({ scope: z.literal("festival"), active: z.boolean().optional(), name: z.string().max(60).optional(), dailyOrderLimit: z.number().int().min(0).optional(),
  leadHours: z.number().min(0).max(240).optional(), advanceDeadline: z.string().optional(), productIds: z.array(z.string()).optional() });
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN");
  const p = z.discriminatedUnion("scope", [shop, fest]).parse(await req.json());
  const key = p.scope; const cur = ((await db.shopSetting.findUnique({ where: { key } }))?.value ?? {}) as Record<string, unknown>;
  const { scope, ...rest } = p as any; const next: Record<string, unknown> = { ...cur };
  for (const [k, v] of Object.entries(rest)) {
    if (k === "minOrderRupees") next.minOrderPaise = Math.round((v as number) * 100);
    else if (k === "deliveryFeeRupees") next.deliveryFeePaise = Math.round((v as number) * 100);
    else if (k === "freeDeliveryAboveRupees") next.freeDeliveryAbovePaise = Math.round((v as number) * 100);
    else if (k === "pincodes" || k === "holidays") next[k] = list(v as string);
    else next[k] = v;
  }
  await db.shopSetting.upsert({ where: { key }, update: { value: next as any }, create: { key, value: next as any } });
  return { ok: true };
});
