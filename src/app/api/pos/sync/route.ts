import { z } from "zod";
import { db } from "@/lib/db";
import { handle, fail } from "@/lib/api";
// Optional POS bridge. Decrements ONLINE stock for offline sales a POS reports. Idempotent via externalId.
export const POST = (req: Request) => handle(async () => {
  const key = process.env.POS_API_KEY;
  if (!key || req.headers.get("authorization") !== `Bearer ${key}`) throw fail("Unauthorized", 401);
  const { sales } = z.object({ sales: z.array(z.object({ externalId: z.string(), variantId: z.string(), qty: z.number().int().min(1) })).max(500) }).parse(await req.json());
  let applied = 0;
  for (const s of sales) {
    try {
      await db.$transaction(async (tx) => {
        await tx.inventoryMovement.create({ data: { variantId: s.variantId, type: "POS_SYNC", delta: -s.qty, externalId: s.externalId } }); // unique => duplicates rejected
        await tx.$executeRaw`UPDATE "InventoryAllocation" SET "onlineQty" = GREATEST("onlineQty" - ${s.qty}, reserved) WHERE "variantId" = ${s.variantId}`;
      }); applied++;
    } catch (e: any) { if (e.code !== "P2002") throw e; }
  }
  return { applied };
});
