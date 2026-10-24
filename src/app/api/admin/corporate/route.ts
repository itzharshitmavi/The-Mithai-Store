import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle } from "@/lib/api";
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  const { id, status } = z.object({ id: z.string(), status: z.enum(["NEW", "CONTACTED", "DONE"]) }).parse(await req.json());
  await db.corporateEnquiry.update({ where: { id }, data: { status } });
  return { ok: true };
});
