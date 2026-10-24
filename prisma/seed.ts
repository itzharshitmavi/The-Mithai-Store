import "dotenv/config";
// DEVELOPMENT SAMPLE DATA ONLY. Do not run against production except for the admin bootstrap.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const pw = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !pw || pw.length < 8) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and a password of at least 8 characters in .env",
    );
  }

  const passwordHash = await bcrypt.hash(pw, 12);

  await db.user.upsert({
    where: { email },
    update: {
      name: "Shop Owner",
      role: "ADMIN",
      passwordHash,
    },
    create: {
      email,
      name: "Shop Owner",
      role: "ADMIN",
      passwordHash,
    },
  });

  await db.shopSetting.upsert({
    where: { key: "shop" },
    update: {},
    create: {
      key: "shop",
      value: {
        paused: false,
        minOrderPaise: 30000,
        deliveryFeePaise: 4000,
        freeDeliveryAbovePaise: 150000,
        pincodes: ["250001", "250002"],
        leadHours: 2,
        reservationMinutes: 15,
      },
    },
  });
  if (process.env.SEED_SAMPLE !== "1")
    return console.log("Admin ready. Set SEED_SAMPLE=1 for sample catalogue.");
  const cat = await db.category.upsert({
    where: { slug: "classic" },
    update: {},
    create: { name: "Classic Sweets", slug: "classic" },
  });
  await db.category.upsert({
    where: { slug: "diwali" },
    update: {},
    create: {
      name: "Diwali Collection",
      slug: "diwali",
      isFestival: true,
      sortOrder: 1,
    },
  });
  const p = await db.product.upsert({
    where: { slug: "kaju-katli" },
    update: {},
    create: {
      name: "Kaju Katli",
      slug: "kaju-katli",
      description: "Silky cashew fudge with edible silver leaf.",
      categoryId: cat.id,
    },
  });
  for (const [label, grams, price] of [
    ["250 g", 250, 28000],
    ["500 g", 500, 54000],
    ["1 kg", 1000, 105000],
  ] as const) {
    const v = await db.variant.upsert({
      where: { productId_grams: { productId: p.id, grams } },
      update: {},
      create: { productId: p.id, label, grams, pricePaise: price },
    });
    await db.inventoryAllocation.upsert({
      where: { variantId: v.id },
      update: {},
      create: { variantId: v.id, onlineQty: 20 },
    });
  }
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  for (const type of ["DELIVERY", "PICKUP"] as const)
    for (const [s, e] of [
      ["10:00", "13:00"],
      ["13:00", "16:00"],
      ["16:00", "19:00"],
    ])
      await db.deliverySlot.create({
        data: {
          date: d,
          type,
          startTime: s,
          endTime: e,
          maxOrders: 10,
          maxWorkload: 40,
        },
      });
}
main().finally(() => db.$disconnect());
