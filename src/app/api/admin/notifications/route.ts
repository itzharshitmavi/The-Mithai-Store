import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { handle } from "@/lib/api";
import { retryNotification } from "@/lib/notify";
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  await retryNotification(z.object({ id: z.string() }).parse(await req.json()).id);
  return { ok: true };
});
