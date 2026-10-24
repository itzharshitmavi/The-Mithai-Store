import nodemailer from "nodemailer";
import { db } from "./db";

async function deliver(id: string) {
  const n = await db.notification.findUniqueOrThrow({ where: { id } });
  try {
    if (!process.env.SMTP_HOST) throw new Error("SMTP not configured");
    const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await t.sendMail({ from: process.env.MAIL_FROM, to: n.toAddress, subject: n.subject, text: n.body });
    await db.notification.update({ where: { id }, data: { status: "SENT", error: null, attempts: { increment: 1 } } });
  } catch (e: any) {
    await db.notification.update({ where: { id }, data: { status: "FAILED", attempts: { increment: 1 }, error: String(e.message).slice(0, 300) } });
  }
}
// The order is saved before this runs. Failures are recorded and shown in admin, never thrown.
export async function queueEmail(orderId: string | null, to: string, subject: string, body: string) {
  const n = await db.notification.create({ data: { orderId, toAddress: to, subject, body } });
  await deliver(n.id);
}
export const retryNotification = (id: string) => deliver(id);
