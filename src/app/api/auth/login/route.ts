import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword, startSession, rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!rateLimit("login:" + (req.headers.get("x-forwarded-for") ?? "ip") + String(email), 6)) return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  const u = typeof email === "string" ? await db.user.findUnique({ where: { email: email.toLowerCase() } }) : null;
  if (!u || typeof password !== "string" || !(await checkPassword(password, u.passwordHash))) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  await startSession(u.id, u.role);
  return NextResponse.json({ ok: true, role: u.role });
}
