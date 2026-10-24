import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, startSession, rateLimit } from "@/lib/auth";

const schema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), phone: z.string().regex(/^[6-9]\d{9}$/).optional(), password: z.string().min(8).max(100) });
export async function POST(req: Request) {
  if (!rateLimit("reg:" + (req.headers.get("x-forwarded-for") ?? "ip"), 5)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  const u = await db.user.create({ data: { name: p.data.name, email, phone: p.data.phone, passwordHash: await hashPassword(p.data.password) } });
  await startSession(u.id, u.role);
  return NextResponse.json({ ok: true });
}
