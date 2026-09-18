// src/app/api/admin/seed-views-bulk/route.js
// Step-based seed using single raw SQL UPDATE for speed.
//   POST { "step": "reset" }  — reset all views to 0
//   POST { "step": "seed" }   — seed ALL cars in one SQL query
//   GET  — status check
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function GET() {
  const total = await db.car.count({ where: { available: true } });
  const zeroViews = await db.car.count({ where: { available: true, views: 0 } });
  const seeded = await db.car.count({ where: { available: true, views: { gt: 0 } } });
  const top5 = await db.car.findMany({
    where: { available: true },
    orderBy: { views: "desc" },
    take: 5,
    select: { make: true, model: true, year: true, views: true },
  });
  const avg = await db.car.aggregate({ _avg: { views: true }, where: { available: true } });
  return NextResponse.json({ total, zeroViews, seeded, avgViews: Math.round(avg._avg.views || 0), top5 });
}

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const { step } = body;

  if (step === "reset") {
    await db.$executeRawUnsafe(`UPDATE cars SET views = 0`);
    return NextResponse.json({ reset: true, message: "All views reset to 0" });
  }

  if (step === "seed") {
    const cars = await db.car.findMany({
      where: { available: true },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const totalCars = cars.length;
    const now = Date.now();
    const oneWeek = 7 * 86400000;

    const cases = [];
    let totalViews = 0;

    for (let i = 0; i < totalCars; i++) {
      const car = cars[i];
      const hash = hashCode(car.id);
      const isNew = now - new Date(car.createdAt).getTime() < oneWeek;
      const pct = i / totalCars;

      let targetViews;
      if (pct < 0.05) targetViews = randInt(2500, 3000);
      else if (pct < 0.15) targetViews = randInt(1500, 2500);
      else if (pct < 0.35) targetViews = randInt(800, 1500);
      else if (pct < 0.6) targetViews = randInt(400, 800);
      else if (pct < 0.85) targetViews = randInt(150, 400);
      else targetViews = randInt(50, 150);

      if (isNew) targetViews = Math.max(targetViews, randInt(300, 600));
      const jitter = (hash % 200) - 100;
      targetViews = Math.max(50, targetViews + jitter);

      // Escape single quotes in ID
      const safeId = car.id.replace(/'/g, "''");
      cases.push(`WHEN id = '${safeId}' THEN ${targetViews}`);
      totalViews += targetViews;
    }

    const sql = `UPDATE cars SET views = CASE ${cases.join("\n")} ELSE views END`;
    await db.$executeRawUnsafe(sql);

    const top10 = await db.car.findMany({
      orderBy: { views: "desc" },
      take: 10,
      select: { make: true, model: true, year: true, views: true },
    });

    return NextResponse.json({
      processed: totalCars,
      totalViews,
      avgViews: Math.round(totalViews / totalCars),
      top10,
    });
  }

  return NextResponse.json({ error: "Send { \"step\": \"reset\" } or { \"step\": \"seed\" }" });
}
