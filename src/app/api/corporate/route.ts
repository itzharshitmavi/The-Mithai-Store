import { z } from "zod";
import { db } from "@/lib/db";
import { handle, fail } from "@/lib/api";
import { rateLimit } from "@/lib/auth";
export const POST = (req: Request) => handle(async () => {
  if (!rateLimit("corp:" + (req.headers.get("x-forwarded-for") ?? "ip"), 3, 600_000)) throw fail("Too many requests. Please call the shop.", 429);
  const p = z.object({ name: z.string().min(2).max(80), company: z.string().min(2).max(120), phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    email: z.string().email().optional().or(z.literal("")), details: z.string().min(5).max(1500) }).parse(await req.json());
  await db.corporateEnquiry.create({ data: { ...p, email: p.email || undefined } });
  return { ok: true };
});
