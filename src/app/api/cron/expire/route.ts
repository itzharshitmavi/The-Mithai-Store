import { db } from "@/lib/db";
import { handle, fail } from "@/lib/api";
import { expireReservations } from "@/lib/orders";
import { retryNotification } from "@/lib/notify";
// Call every 5 minutes: curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/expire
export const GET = (req: Request) => handle(async () => {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) throw fail("Unauthorized", 401);
  await expireReservations();
  const failed = await db.notification.findMany({ where: { status: "FAILED", attempts: { lt: 3 } }, take: 20 });
  for (const n of failed) await retryNotification(n.id);
  return { ok: true, retried: failed.length };
});
