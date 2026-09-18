// src/app/api/cron/view-organic/route.js
// Daily cron: adds 80-150 organic-simulated views per car per day.
// Continues from existing count (additive). Creates CarView records for consistency.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 0;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return await runOrganicViews();
}

export async function runOrganicViews() {
  const now = new Date();

  const cars = await db.car.findMany({
    where: { available: true },
    select: { id: true, views: true },
  });

  let viewsCreated = 0;
  const batchSize = 30;

  for (let i = 0; i < cars.length; i += batchSize) {
    const batch = cars.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (car) => {
        const increment = randInt(80, 150);

        // Additive — continues from current count
        await db.car.update({
          where: { id: car.id },
          data: { views: { increment } },
        });

        const viewBatch = [];
        for (let j = 0; j < increment; j++) {
          viewBatch.push({
            carId: car.id,
            sessionKey: `organic-${now.toISOString().slice(0, 10)}-${randInt(10000, 99999)}`,
            viewedAt: new Date(now.getTime() - randInt(0, 24 * 60 * 60 * 1000)),
          });
        }
        await db.carView.createMany({ data: viewBatch });
        viewsCreated += increment;
      })
    );
  }

  return { carsUpdated: cars.length, viewsAdded: viewsCreated };
}
