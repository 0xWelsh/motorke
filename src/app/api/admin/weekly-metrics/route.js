export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const currentStart = new Date(now - weekMs);
  const previousStart = new Date(now - weekMs * 2);

  const [
    publishedCurrent,
    publishedPrevious,
    leadsCurrent,
    leadsPrevious,
    activeListings,
    staleListings,
    responseCoverage,
  ] = await Promise.all([
    db.car.count({ where: { createdAt: { gte: currentStart } } }),
    db.car.count({ where: { createdAt: { gte: previousStart, lt: currentStart } } }),
    db.lead.count({ where: { createdAt: { gte: currentStart } } }),
    db.lead.count({ where: { createdAt: { gte: previousStart, lt: currentStart } } }),
    db.car.count({ where: { available: true } }),
    db.car.count({ where: { available: true, updatedAt: { lt: new Date(now - 30 * 24 * 60 * 60 * 1000) } } }),
    db.lead.count({ where: { status: { not: "NEW" }, createdAt: { gte: currentStart } } }),
  ]);

  const leadResponseRate = leadsCurrent > 0 ? Number(((responseCoverage / leadsCurrent) * 100).toFixed(2)) : 0;

  return NextResponse.json({
    generatedAt: Date.now(),
    windows: {
      currentStart: currentStart.toISOString(),
      previousStart: previousStart.toISOString(),
    },
    kpis: {
      listingCompletionProxy: {
        current: publishedCurrent,
        previous: publishedPrevious,
        deltaPct: pctChange(publishedCurrent, publishedPrevious),
      },
      leadsPerActiveListing: {
        current: activeListings > 0 ? Number((leadsCurrent / activeListings).toFixed(4)) : 0,
        previous: activeListings > 0 ? Number((leadsPrevious / activeListings).toFixed(4)) : 0,
      },
      leadResponseRate: {
        current: leadResponseRate,
        previous: null,
      },
      staleListingRatio: {
        current: activeListings > 0 ? Number(((staleListings / activeListings) * 100).toFixed(2)) : 0,
        previous: null,
      },
    },
    raw: {
      publishedCurrent,
      publishedPrevious,
      leadsCurrent,
      leadsPrevious,
      activeListings,
      staleListings,
      responseCoverage,
    },
  });
}
