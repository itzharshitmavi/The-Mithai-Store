import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const schema = z.object({ variantId: z.string(), action: z.enum(["SET", "ADD", "MODE"]), qty: z.number().int().min(0).max(100000).optional(), mode: z.enum(["NORMAL", "LIMITED", "SOLD_OUT"]).optional(), note: z.string().max(200).optional(), bestBefore: z.string().optional() });
export async function POST(req: Request) {
  try {
    const admin = await requireRole("ADMIN", "STAFF");
    const p = schema.parse(await req.json());
    await db.$transaction(async (tx) => {
      await tx.inventoryAllocation.upsert({ where: { variantId: p.variantId }, create: { variantId: p.variantId }, update: {} });
      const cur = await tx.inventoryAllocation.findUniqueOrThrow({ where: { variantId: p.variantId } });
      if (p.action === "MODE") { await tx.inventoryAllocation.update({ where: { variantId: p.variantId }, data: { mode: p.mode! } }); return; }
      const target = p.action === "SET" ? p.qty! : cur.onlineQty + p.qty!;
      if (target < cur.reserved) throw new Response(JSON.stringify({ error: `Cannot go below ${cur.reserved} (held by unpaid orders)` }), { status: 409 });
      await tx.inventoryAllocation.update({ where: { variantId: p.variantId }, data: { onlineQty: target, mode: target === 0 ? "SOLD_OUT" : cur.mode === "SOLD_OUT" ? "NORMAL" : cur.mode } });
      await tx.inventoryMovement.create({ data: { variantId: p.variantId, type: p.action === "ADD" ? "ADD_PREPARED" : "ALLOCATE", delta: target - cur.onlineQty, note: p.note || undefined, bestBefore: p.bestBefore ? new Date(p.bestBefore) : undefined, actorId: admin.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e.issues?.[0]?.message ?? "Failed" }, { status: 400 });
  }
}
