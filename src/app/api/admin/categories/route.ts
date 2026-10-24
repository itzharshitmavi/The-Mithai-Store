import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle } from "@/lib/api";
import { slugify } from "@/lib/money";
const schema = z.object({ id: z.string().optional(), name: z.string().min(2).max(60), isFestival: z.boolean().optional(), sortOrder: z.number().int().optional() });
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  const p = schema.parse(await req.json()); const data = { name: p.name, isFestival: !!p.isFestival, sortOrder: p.sortOrder ?? 0 };
  if (p.id) await db.category.update({ where: { id: p.id }, data });
  else await db.category.create({ data: { ...data, slug: slugify(p.name) } });
  return { ok: true };
});
