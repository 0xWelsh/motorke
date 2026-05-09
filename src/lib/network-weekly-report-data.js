// Aggregates marketplace-wide analytics for the admin weekly network PDF.

import { db } from "@/lib/db";
import { formatCarPrice } from "@/lib/utils";

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatRangeShort(from, to, locale = "en-KE") {
  const opts = { day: "numeric", month: "short", year: "numeric" };
  return `${from.toLocaleDateString(locale, opts)} — ${to.toLocaleDateString(locale, opts)}`;
}

function pctDelta(cur, prev) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

/**
 * Dealer rows: period listing-detail views, leads, active stock — sorted by traffic.
 */
async function fetchDealerLeaderboard(periodStart, periodEnd) {
  /** Postgres: @@map tables car_views, cars, leads, dealers */
  const rows = await db.$queryRaw`
    SELECT d.id,
           d.name,
           d.location,
           COALESCE(v.cnt, 0)::int AS "periodViews",
           COALESCE(l.cnt, 0)::int AS "periodLeads",
           COALESCE(a.cnt, 0)::int AS "activeListings"
    FROM dealers d
    LEFT JOIN (
      SELECT c."dealerId", COUNT(cv.id)::int AS cnt
      FROM car_views cv
      INNER JOIN cars c ON c.id = cv."carId"
      WHERE cv."viewedAt" >= ${periodStart} AND cv."viewedAt" <= ${periodEnd}
      GROUP BY c."dealerId"
    ) v ON v."dealerId" = d.id
    LEFT JOIN (
      SELECT "dealerId", COUNT(*)::int AS cnt
      FROM leads
      WHERE "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
      GROUP BY "dealerId"
    ) l ON l."dealerId" = d.id
    LEFT JOIN (
      SELECT "dealerId", COUNT(*)::int AS cnt
      FROM cars
      WHERE available = true
      GROUP BY "dealerId"
    ) a ON a."dealerId" = d.id
    ORDER BY COALESCE(v.cnt, 0) DESC, d.name ASC
    LIMIT 35
  `;

  return rows.map((r) => ({
    name: String(r.name ?? ""),
    location: String(r.location ?? "—"),
    periodViews: Number(r.periodViews ?? r.periodviews ?? 0),
    periodLeads: Number(r.periodLeads ?? r.periodleads ?? 0),
    activeListings: Number(r.activeListings ?? r.activelistings ?? 0),
  }));
}

/**
 * Rolling 7-day window vs prior 7 days — entire marketplace.
 */
export async function buildNetworkWeeklyReportPayload() {
  const now = new Date();
  const periodEnd = now;
  const periodStart = addDays(now, -7);
  const prevPeriodStart = addDays(now, -14);

  const [
    totalDealers,
    dealersWithStock,
    activeListings,
    periodViewsCount,
    prevPeriodViewsCount,
    periodLeadsCount,
    prevPeriodLeadsCount,
    lifetimeWhatsappAgg,
    lifetimePrintAgg,
    lifetimeViewsAgg,
    topGroups,
    dealerLeaderboard,
    periodViewsForDaily,
    periodLeadsForDaily,
  ] = await Promise.all([
    db.dealer.count(),
    db.dealer.count({ where: { cars: { some: { available: true } } } }),
    db.car.count({ where: { available: true } }),
    db.carView.count({
      where: { viewedAt: { gte: periodStart, lte: periodEnd } },
    }),
    db.carView.count({
      where: { viewedAt: { gte: prevPeriodStart, lt: prevPeriodEnd } },
    }),
    db.lead.count({
      where: { createdAt: { gte: periodStart, lte: periodEnd } },
    }),
    db.lead.count({
      where: { createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd } },
    }),
    db.car.aggregate({ _sum: { whatsappClicks: true } }),
    db.car.aggregate({ _sum: { printCount: true } }),
    db.car.aggregate({ _sum: { views: true } }),
    db.carView.groupBy({
      by: ["carId"],
      where: {
        viewedAt: { gte: periodStart, lte: periodEnd },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    }),
    fetchDealerLeaderboard(periodStart, periodEnd),
    db.carView.findMany({
      where: { viewedAt: { gte: periodStart, lte: periodEnd } },
      select: { viewedAt: true },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: periodStart, lte: periodEnd } },
      select: { createdAt: true },
    }),
  ]);

  const carIds = topGroups.map((g) => g.carId);
  const carsTop =
    carIds.length === 0
      ? []
      : await db.car.findMany({
          where: { id: { in: carIds } },
          select: {
            id: true,
            make: true,
            model: true,
            variant: true,
            year: true,
            price: true,
            dealer: { select: { name: true } },
          },
        });
  const carMap = new Map(carsTop.map((c) => [c.id, c]));

  const topListings = topGroups
    .map((g) => {
      const car = carMap.get(g.carId);
      if (!car) return null;
      const title = [car.year, car.make, car.model, car.variant].filter(Boolean).join(" ");
      return {
        dealerName: car.dealer?.name || "—",
        title,
        periodViews: g._count.id,
        priceLabel: formatCarPrice(car),
      };
    })
    .filter(Boolean);

  const dailyRows = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = addDays(day, 1);
    const viewsRow = periodViewsForDaily.filter((v) => {
      const t = new Date(v.viewedAt);
      return t >= day && t < next;
    }).length;
    const leadsRow = periodLeadsForDaily.filter((l) => {
      const t = new Date(l.createdAt);
      return t >= day && t < next;
    }).length;
    dailyRows.push({
      dayLabel: day.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" }),
      views: viewsRow,
      leads: leadsRow,
    });
  }

  const viewsMom = pctDelta(periodViewsCount, prevPeriodViewsCount);
  const leadsMom = pctDelta(periodLeadsCount, prevPeriodLeadsCount);

  const filenameSuffix = now.toISOString().split("T")[0];

  const narrative = {
    headline:
      periodViewsCount > 0
        ? "Network traffic is measurable — use this page in partner conversations."
        : "Low marketplace detail views this window — inventory or distribution may need a push.",
    sub:
      periodLeadsCount > 0
        ? `${periodLeadsCount} lead${periodLeadsCount === 1 ? "" : "s"} entered the platform in the last 7 days (all dealers).`
        : "No leads in the window yet — tighten listing quality and outbound dealer coaching.",
  };

  return {
    periodLabel: formatRangeShort(periodStart, periodEnd),
    generatedAtLabel: now.toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    filenameSuffix,

    kpis: {
      totalDealers,
      dealersWithStock,
      activeListings,
      periodListingViews: periodViewsCount,
      periodLeads: periodLeadsCount,
      viewsMom,
      leadsMom,
      lifetimeViews: lifetimeViewsAgg._sum.views || 0,
      lifetimeWhatsapp: lifetimeWhatsappAgg._sum.whatsappClicks || 0,
      lifetimePrints: lifetimePrintAgg._sum.printCount || 0,
    },

    daily: dailyRows,
    dealerLeaderboard,
    topListings,

    narrative,
    usedEmptyTopListings: topListings.length === 0,
  };
}
