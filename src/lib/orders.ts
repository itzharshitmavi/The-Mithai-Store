import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";

export class OrderError extends Error { constructor(m: string, public status = 409) { super(m); } }
type Tx = Prisma.TransactionClient;

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(8).max(100),
  items: z.array(z.object({ variantId: z.string(), qty: z.number().int().min(1).max(50) })).min(1).max(40),
  fulfilment: z.enum(["DELIVERY", "PICKUP"]),
  slotId: z.string(),
  paymentMethod: z.enum(["COD", "ONLINE"]),
  contactName: z.string().min(2).max(80),
  contactPhone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  guestEmail: z.string().email().optional(),
  addressLine: z.string().max(300).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  couponCode: z.string().max(30).optional(),
  note: z.string().max(300).optional(),
});

export async function getShop() {
  const row = await db.shopSetting.findUnique({ where: { key: "shop" } });
  const f = await db.shopSetting.findUnique({ where: { key: "festival" } });
  const base = { name: "Mithai House", phone: "", whatsapp: "", address: "", mapUrl: "", hours: "", holidays: [] as string[],
    deliveryPolicy: "", cancellationPolicy: "", paused: false, minOrderPaise: 30000, deliveryFeePaise: 4000,
    freeDeliveryAbovePaise: 150000, pincodes: [] as string[], leadHours: 2, reservationMinutes: 15, ...(row?.value as object ?? {}) };
  const festival = { active: false, name: "", productIds: [] as string[], dailyOrderLimit: 0, leadHours: 0, advanceDeadline: "", ...(f?.value as object ?? {}) };
  return { ...base, festival };
}
export function slotStart(slot: { date: Date; startTime: string }) {
  const [h, m] = slot.startTime.split(":").map(Number);
  const d = new Date(slot.date); d.setUTCHours(h - 5, m - 30, 0, 0); // slot times are IST
  return d;
}
export const deadlineOf = (s: string) => new Date(s.length === 16 ? s + ":00+05:30" : s);

export async function createOrder(raw: unknown, userId: string | null) {
  const input = checkoutSchema.parse(raw);
  await expireReservations();
  const dup = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (dup) return dup; // duplicate checkout click/retry
  const shop = await getShop();
  if (shop.paused) throw new OrderError("Online ordering is paused right now. Please try again later or call the shop.");
  if (!userId && !input.guestEmail) throw new OrderError("Email is required for guest checkout", 400);

  try {
    return await db.$transaction(async (tx) => {
      const merged = new Map<string, number>();
      input.items.forEach((i) => merged.set(i.variantId, (merged.get(i.variantId) ?? 0) + i.qty));
      const ids = [...merged.keys()].sort(); // fixed lock order avoids deadlocks
      const variants = await tx.variant.findMany({ where: { id: { in: ids } }, include: { product: true, allocation: true } });
      if (variants.length !== ids.length) throw new OrderError("An item in your cart no longer exists", 400);

      let subtotal = 0, workload = 0;
      for (const v of variants) {
        const q = merged.get(v.id)!;
        if (!v.active || !v.product.active) throw new OrderError(`${v.product.name} (${v.label}) is not available`);
        if (!v.allocation || v.allocation.mode === "SOLD_OUT") throw new OrderError(`${v.product.name} (${v.label}) is sold out online`);
        subtotal += v.pricePaise * q;
        workload += Math.ceil((v.product.prepWorkload * v.grams * q) / 1000);
      }
      const fest = shop.festival;
      if (fest.active && fest.advanceDeadline && deadlineOf(fest.advanceDeadline) < new Date()) throw new OrderError("Advance orders for this festival have closed");
      for (const v of variants) {
        if (v.product.festivalOnly && !fest.active) throw new OrderError(`${v.product.name} is only available during festival ordering`);
        if (fest.active && fest.productIds.length && !fest.productIds.includes(v.productId)) throw new OrderError(`${v.product.name} is not available during ${fest.name || "festival"} ordering`);
      }
      if (subtotal < shop.minOrderPaise) throw new OrderError(`Minimum order is ₹${shop.minOrderPaise / 100}`, 400);

      if (input.fulfilment === "DELIVERY") {
        if (!input.addressLine || !input.pincode) throw new OrderError("Delivery address and PIN code are required", 400);
        if (!shop.pincodes.includes(input.pincode)) throw new OrderError("Sorry, we do not deliver to this PIN code", 400);
      }
      const slot = await tx.deliverySlot.findUnique({ where: { id: input.slotId } });
      if (!slot || !slot.open || slot.type !== input.fulfilment) throw new OrderError("Selected time slot is unavailable");
      if (shop.holidays.includes(slot.date.toISOString().slice(0, 10))) throw new OrderError("The shop is closed on this date");
      const lead = Math.max(shop.leadHours, fest.active ? fest.leadHours : 0);
      if (slotStart(slot).getTime() - Date.now() < lead * 3600_000) throw new OrderError(`We need ${lead} hours to prepare. Same-day ordering is unavailable for this slot, please choose a later slot or day.`);
      if (fest.active && fest.dailyOrderLimit > 0) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"day:" + slot.date.toISOString().slice(0, 10)}))`;
        const n = await tx.order.count({ where: { slot: { date: slot.date }, status: { notIn: ["CANCELLED", "REJECTED"] } } });
        if (n >= fest.dailyOrderLimit) throw new OrderError("We have reached our online order limit for this day. Please choose another date.");
      }

      let discount = 0;
      if (input.couponCode) {
        const c = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
        if (!c || !c.active || (c.expiresAt && c.expiresAt < new Date()) || subtotal < c.minOrderPaise) throw new OrderError("Coupon is not valid for this order", 400);
        const ok = await tx.$executeRaw`UPDATE "Coupon" SET used = used + 1 WHERE id = ${c.id} AND ("maxUses" IS NULL OR used < "maxUses")`;
        if (!ok) throw new OrderError("Coupon usage limit reached", 400);
        discount = Math.min(subtotal, c.percentOff ? Math.floor((subtotal * c.percentOff) / 100) : c.flatOffPaise ?? 0);
      }
      const delivery = input.fulfilment === "DELIVERY" && subtotal - discount < shop.freeDeliveryAbovePaise ? shop.deliveryFeePaise : 0;

      // Atomic conditional updates: only one concurrent buyer can take the last unit.
      for (const v of variants) {
        const q = merged.get(v.id)!;
        const ok = await tx.$executeRaw`UPDATE "InventoryAllocation" SET reserved = reserved + ${q}, "updatedAt" = now()
          WHERE "variantId" = ${v.id} AND mode <> 'SOLD_OUT' AND "onlineQty" - reserved >= ${q}`;
        if (!ok) throw new OrderError(`Only limited stock left for ${v.product.name} (${v.label}). Please reduce quantity or remove it.`);
      }
      const slotOk = await tx.$executeRaw`UPDATE "DeliverySlot" SET "bookedOrders" = "bookedOrders" + 1, "bookedWorkload" = "bookedWorkload" + ${workload}
        WHERE id = ${slot.id} AND open AND "bookedOrders" < "maxOrders" AND "bookedWorkload" + ${workload} <= "maxWorkload"`;
      if (!slotOk) throw new OrderError("This time slot just became full. Please pick another.");

      const online = input.paymentMethod === "ONLINE";
      const order = await tx.order.create({ data: {
        idempotencyKey: input.idempotencyKey, userId, guestEmail: input.guestEmail, contactName: input.contactName,
        contactPhone: input.contactPhone, fulfilment: input.fulfilment, slotId: slot.id, addressLine: input.addressLine,
        pincode: input.pincode, paymentMethod: input.paymentMethod, subtotalPaise: subtotal, discountPaise: discount,
        deliveryPaise: delivery, totalPaise: subtotal - discount + delivery, couponCode: input.couponCode?.toUpperCase(),
        workload, note: input.note, reservedUntil: online ? new Date(Date.now() + shop.reservationMinutes * 60_000) : null,
        items: { create: variants.map((v) => ({ variantId: v.id, productName: v.product.name, variantLabel: v.label, unitPricePaise: v.pricePaise, qty: merged.get(v.id)! })) },
      } });
      if (!online) await commitStock(tx, order.id); // COD: deduct now
      return order;
    });
  } catch (e: any) {
    if (e.code === "P2002") { // concurrent duplicate with same key
      const again = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (again) return again;
    }
    throw e;
  }
}

// Turn a reservation into a real deduction (idempotent).
export async function commitStock(tx: Tx, orderId: string) {
  const claimed = await tx.order.updateMany({ where: { id: orderId, stockCommitted: false, stockReleased: false }, data: { stockCommitted: true, reservedUntil: null } });
  if (!claimed.count) return false;
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const i of items) {
    await tx.$executeRaw`UPDATE "InventoryAllocation" SET "onlineQty" = "onlineQty" - ${i.qty}, reserved = reserved - ${i.qty} WHERE "variantId" = ${i.variantId}`;
    await tx.inventoryMovement.create({ data: { variantId: i.variantId, type: "ONLINE_SALE", delta: -i.qty, orderId } });
  }
  return true;
}

// Give stock + slot capacity back (cancel/reject/expiry). Idempotent.
export async function releaseOrder(tx: Tx, orderId: string) {
  const claimed = await tx.order.updateMany({ where: { id: orderId, stockReleased: false }, data: { stockReleased: true, reservedUntil: null } });
  if (!claimed.count) return false;
  const o = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  for (const i of o.items) {
    if (o.stockCommitted) await tx.$executeRaw`UPDATE "InventoryAllocation" SET "onlineQty" = "onlineQty" + ${i.qty} WHERE "variantId" = ${i.variantId}`;
    else await tx.$executeRaw`UPDATE "InventoryAllocation" SET reserved = reserved - ${i.qty} WHERE "variantId" = ${i.variantId}`;
    await tx.inventoryMovement.create({ data: { variantId: i.variantId, type: "RELEASE", delta: o.stockCommitted ? i.qty : 0, orderId, note: o.stockCommitted ? "returned to online stock" : "reservation released" } });
  }
  await tx.$executeRaw`UPDATE "DeliverySlot" SET "bookedOrders" = GREATEST("bookedOrders" - 1, 0), "bookedWorkload" = GREATEST("bookedWorkload" - ${o.workload}, 0) WHERE id = ${o.slotId}`;
  return true;
}

// Run lazily on checkout/slots/dashboard and from a cron hitting any of them every few minutes.
export async function expireReservations() {
  const stale = await db.order.findMany({ where: { paymentMethod: "ONLINE", paymentStatus: "PENDING", stockCommitted: false, stockReleased: false, reservedUntil: { lt: new Date() } }, select: { id: true } });
  for (const { id } of stale) await db.$transaction(async (tx) => {
    if (await releaseOrder(tx, id)) await tx.order.update({ where: { id }, data: { status: "CANCELLED", paymentStatus: "FAILED", note: "Payment not completed in time" } });
  });
}

// Called only from the verified webhook.
export async function markPaid(providerOrderId: string, providerPaymentId: string, amountPaise: number) {
  return db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { providerOrderId }, include: { order: true } });
    if (!p || p.amountPaise !== amountPaise) throw new OrderError("Payment mismatch", 400);
    if (p.status === "PAID") return p.order; // idempotent
    await tx.payment.update({ where: { id: p.id }, data: { status: "PAID", providerPaymentId } });
    if (p.order.stockReleased) { // paid after reservation expired: do NOT oversell; flag for refund
      await tx.order.update({ where: { id: p.orderId }, data: { paymentStatus: "REFUND_PENDING", status: "CANCELLED" } });
    } else {
      await commitStock(tx, p.orderId);
      await tx.order.update({ where: { id: p.orderId }, data: { paymentStatus: "PAID" } });
    }
    return tx.order.findUniqueOrThrow({ where: { id: p.orderId } });
  });
}
