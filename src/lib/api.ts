import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { OrderError } from "./orders";
export async function handle(fn: () => Promise<unknown>) {
  try { return NextResponse.json(await fn()); }
  catch (e: any) {
    if (e instanceof Response) return e;
    if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
export const fail = (error: string, status = 400) => new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });
