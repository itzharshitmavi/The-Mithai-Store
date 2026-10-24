import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle } from "@/lib/api";
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  const { id, action } = z.object({ id: z.string(), action: z.enum(["APPROVE", "DELETE"]) }).parse(await req.json());
  action === "APPROVE" ? await db.review.update({ where: { id }, data: { approved: true } }) : await db.review.delete({ where: { id } });
  return { ok: true };
});
