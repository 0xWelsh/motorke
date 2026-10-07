// src/app/api/cron/auto-expire-local/route.js
// Locally-used cars sell fast and are scarce — auto-remove listings after
// LOCAL_LIFETIME_DAYS. Imported cars are easy to re-source, so they stay.
//
// "All from today": every local car gets a fresh window starting at
// ACTIVATION_DATE, so existing stock is grandfathered for 30 more days and
// only NEW locals expire 30 days after they're listed.
//
// Safety: cars that have any leads are NEVER deleted here (deleting the car
// cascades its leads and loses buyer enquiries) — they just stay listed.
//
// Guarded by CRON_SECRET, same as the other /api/cron endpoints.
export const revalidate = 0;

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/storage";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";

const LOCAL_LIFETIME_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;
// Feature activated 2026-09-24: every pre-existing local car re-anchors here.
const ACTIVATION_DATE = new Date("2026-09-24T00:00:00.000Z");

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const status = await runLocalExpiry({ dryRun });
  return NextResponse.json(status);
}

export async function runLocalExpiry({ dryRun = false } = {}) {
  const cutoff = new Date(Date.now() - LOCAL_LIFETIME_DAYS * DAY);

  const cars = await db.car.findMany({
    where: { imported: false },
    include: { images: true, _count: { select: { leads: true } } },
    orderBy: { createdAt: "asc" },
  });

  const candidates = cars.filter((car) => {
    // Existing stock re-anchors at ACTIVATION; new cars count from listing.
    const anchor = car.createdAt > ACTIVATION_DATE ? car.createdAt : ACTIVATION_DATE;
    return anchor.getTime() < cutoff.getTime();
  });

  const stats = {
    lifetimeDays: LOCAL_LIFETIME_DAYS,
    activation: ACTIVATION_DATE.toISOString(),
    dryRun,
    cutoff: cutoff.toISOString(),
    localTotal: cars.length,
    candidates: candidates.length,
    deleted: 0,
    skippedWithLeads: 0,
    failures: [],
  };

  for (const car of candidates) {
    if (car._count.leads > 0) {
      stats.skippedWithLeads += 1;
      continue;
    }
    try {
      if (!dryRun) {
        for (const img of car.images) {
          await deleteImage(img.url).catch(() => {});
        }
        await db.lead.deleteMany({ where: { carId: car.id } });
        await db.carView.deleteMany({ where: { carId: car.id } });
        await db.savedCar.deleteMany({ where: { carId: car.id } });
        await db.carImage.deleteMany({ where: { carId: car.id } });
        await db.car.delete({ where: { id: car.id } });
        await revalidateInventoryForCar(car.id, { refreshHomepage: true });
      }
      stats.deleted += 1;
    } catch (err) {
      stats.failures.push({
        id: car.id,
        name: `${car.year} ${car.make} ${car.model}`,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return stats;
}