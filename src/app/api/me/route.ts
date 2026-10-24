import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json(null);
  const a = await db.address.findFirst({ where: { userId: u.id }, orderBy: { id: "desc" } });
  return NextResponse.json({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, address: a ? { line1: a.line1, pincode: a.pincode } : null });
}
