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

  const CORE_EVENTS = [
    "page_view",
    "cars_listing_view",
    "view_car_click",
    "view_car",
    "open_whatsapp",
    "open_call",
    "submit_lead",
    "dealer_page_view",
  ];

  const [events7d, events30d, top7d, coreEventRows] = await Promise.all([
    db.marketingEvent.count({ where: { createdAt: { gte: start7d } } }),
    db.marketingEvent.count({ where: { createdAt: { gte: start30d } } }),
    db.marketingEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: start7d } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    db.marketingEvent.groupBy({
      by: ["name"],
      where: {
        createdAt: { gte: start7d },
        name: { in: CORE_EVENTS },
      },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);
  const eventCountMap = Object.fromEntries(coreEventRows.map((row) => [row.name, row._count._all]));
  const carsListingViews = eventCountMap.cars_listing_view || 0;
  const carDetailsViewed = eventCountMap.view_car || 0;
  const outboundIntent = (eventCountMap.open_whatsapp || 0) + (eventCountMap.open_call || 0);
  const leadsSubmitted = eventCountMap.submit_lead || 0;

  const safePct = (a, b) => (b > 0 ? Number(((a / b) * 100).toFixed(2)) : 0);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totals: { events7d, events30d },
    topEvents7d: top7d.map((row) => ({ name: row.name, count: row._count._all })),
    coreEvents7d: CORE_EVENTS.map((name) => ({ name, count: eventCountMap[name] || 0 })),
    funnel7d: {
      cars_listing_view: carsListingViews,
      view_car: carDetailsViewed,
      contact_intent: outboundIntent,
      submit_lead: leadsSubmitted,
      listing_to_detail_rate_pct: safePct(carDetailsViewed, carsListingViews),
      detail_to_contact_rate_pct: safePct(outboundIntent, carDetailsViewed),
      detail_to_lead_rate_pct: safePct(leadsSubmitted, carDetailsViewed),
    },
  });
}
