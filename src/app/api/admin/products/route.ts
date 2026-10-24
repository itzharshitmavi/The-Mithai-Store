import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handle, fail } from "@/lib/api";
import { slugify } from "@/lib/money";
const schema = z.object({ id: z.string().optional(), name: z.string().min(2).max(120), description: z.string().min(2).max(1000), categoryId: z.string(),
  imageUrl: z.string().max(500).optional(), isGiftBox: z.boolean().optional(), festivalOnly: z.boolean().optional(), active: z.boolean().optional(),
  prepWorkload: z.number().int().min(1).max(100).optional(), variants: z.string().min(3) });
// variants: one per line "label|grams|price in rupees", e.g. "250 g|250|280"
function parseVariants(text: string) {
  const out = text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [label, g, r] = l.split("|").map((x) => x.trim()); const grams = Number(g), rupees = Number(r);
    if (!label || !Number.isInteger(grams) || grams <= 0 || !(rupees > 0)) throw fail(`Bad variant line: "${l}". Use: 250 g|250|280`);
    return { label, grams, pricePaise: Math.round(rupees * 100) };
  });
  if (new Set(out.map((v) => v.grams)).size !== out.length) throw fail("Two variants have the same weight");
  return out;
}
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  const p = schema.parse(await req.json()); const variants = parseVariants(p.variants);
  const data = { name: p.name, description: p.description, categoryId: p.categoryId, imageUrl: p.imageUrl, isGiftBox: !!p.isGiftBox, festivalOnly: !!p.festivalOnly, active: p.active ?? true, prepWorkload: p.prepWorkload ?? 1 };
  await db.$transaction(async (tx) => {
    let id = p.id;
    if (id) await tx.product.update({ where: { id }, data });
    else {
      let slug = slugify(p.name); if (await tx.product.findUnique({ where: { slug } })) slug += "-" + Math.random().toString(36).slice(2, 6);
      id = (await tx.product.create({ data: { ...data, slug } })).id;
    }
    for (const v of variants) {
      const row = await tx.variant.upsert({ where: { productId_grams: { productId: id, grams: v.grams } }, update: { label: v.label, pricePaise: v.pricePaise, active: true }, create: { ...v, productId: id } });
      await tx.inventoryAllocation.upsert({ where: { variantId: row.id }, update: {}, create: { variantId: row.id } }); // starts at 0 online stock
    }
    await tx.variant.updateMany({ where: { productId: id, grams: { notIn: variants.map((v) => v.grams) } }, data: { active: false } });
  });
  return { ok: true };
});
