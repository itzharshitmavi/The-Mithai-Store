import { z } from "zod";
import { db } from "@/lib/db";
import { handle, fail } from "@/lib/api";
import { currentUser } from "@/lib/auth";
export const POST = (req: Request) => handle(async () => {
  const u = await currentUser(); if (!u) throw fail("Please sign in to review", 401);
  const p = z.object({ productId: z.string(), rating: z.number().int().min(1).max(5), body: z.string().min(3).max(600) }).parse(await req.json());
  const bought = await db.order.findFirst({ where: { userId: u.id, status: "DELIVERED", items: { some: { variant: { productId: p.productId } } } } });
  if (!bought) throw fail("You can review a sweet after receiving it in an order", 403);
  await db.review.create({ data: { ...p, userId: u.id } });
  return { ok: true, message: "Thank you! Your review will appear after approval." };
});
