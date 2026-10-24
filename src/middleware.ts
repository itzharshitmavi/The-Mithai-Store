import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
// Edge guard for /admin pages. API routes re-check the role in the DB.
export async function middleware(req: NextRequest) {
  const t = req.cookies.get("session")?.value;
  try {
    if (!t) throw 0;
    const { payload } = await jwtVerify(t, new TextEncoder().encode(process.env.AUTH_SECRET!));
    if (payload.role !== "ADMIN" && payload.role !== "STAFF") throw 0;
    return NextResponse.next();
  } catch { return NextResponse.redirect(new URL("/login?next=/admin", req.url)); }
}
export const config = { matcher: ["/admin/:path*"] };
