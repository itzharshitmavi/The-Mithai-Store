import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function startSession(userId: string, role: string) {
  const token = await new SignJWT({ role }).setProtectedHeader({ alg: "HS256" })
    .setSubject(userId).setExpirationTime("7d").sign(secret());
  cookies().set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
}
export async function currentUser() {
  const t = cookies().get("session")?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return db.user.findUnique({ where: { id: payload.sub! } });
  } catch { return null; }
}
// Role is re-read from the DB on every call; the cookie claim is never trusted alone.
export async function requireRole(...roles: string[]) {
  const u = await currentUser();
  if (!u || !roles.includes(u.role)) throw new Response("Forbidden", { status: 403 });
  return u;
}
// In-memory limiter; swap for Redis/Upstash if running multiple instances.
const hits = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, max = 10, windowMs = 60_000) {
  const now = Date.now(); const h = hits.get(key);
  if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return true; }
  return ++h.n <= max;
}
