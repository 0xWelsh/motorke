export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const start7d = new Date(now - 7 * day);
  const start30d = new Date(now - 30 * day);

  const [events7d, events30d, top7d] = await Promise.all([
    db.marketingEvent.count({ where: { createdAt: { gte: start7d } } }),
    db.marketingEvent.count({ where: { createdAt: { gte: start30d } } }),
    db.marketingEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: start7d } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totals: { events7d, events30d },
    topEvents7d: top7d.map((row) => ({ name: row.name, count: row._count._all })),
  });
}
