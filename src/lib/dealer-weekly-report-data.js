// Aggregates dealer analytics for the printable weekly PDF (portal).

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
 * Rolling 7-day window ending now vs prior 7 days (for momentum).
 */
export async function buildWeeklyReportPayload(dealerId) {
  const now = new Date();
  const periodEnd = now;
  const periodStart = addDays(now, -7);

  const prevPeriodEnd = periodStart;
  const prevPeriodStart = addDays(now, -14);

  const [dealer, cars, periodViews, prevPeriodViews, periodLeads, prevPeriodLeads, topGroups] = await Promise.all([
    db.dealer.findUnique({
      where: { id: dealerId },
      select: { name: true, location: true, county: true },
    }),
    db.car.findMany({
      where: { dealerId },
      select: {
        id: true,
        make: true,
        model: true,
        variant: true,
        year: true,
        price: true,
        views: true,
        whatsappClicks: true,
        printCount: true,
        available: true,
        createdAt: true,
      },
    }),
    db.carView.findMany({
      where: {
        viewedAt: { gte: periodStart, lte: periodEnd },
        car: { dealerId },
      },
      select: { id: true, carId: true, viewedAt: true },
    }),
    db.carView.findMany({
      where: {
        viewedAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
        car: { dealerId },
      },
      select: { id: true },
    }),
    db.lead.findMany({
      where: {
        dealerId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { id: true, carId: true, createdAt: true },
    }),
    db.lead.findMany({
      where: {
        dealerId,
        createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
      },
      select: { id: true },
    }),
    db.carView.groupBy({
      by: ["carId"],
      where: {
        viewedAt: { gte: periodStart, lte: periodEnd },
        car: { dealerId },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
  ]);

  const carMap = new Map(cars.map((c) => [c.id, c]));

  const topFromPeriod = topGroups
    .map((g) => {
      const car = carMap.get(g.carId);
      if (!car) return null;
      const title = [car.year, car.make, car.model, car.variant].filter(Boolean).join(" ");
      return {
        title,
        periodViews: g._count.id,
        priceLabel: formatCarPrice(car),
      };
    })
    .filter(Boolean);

  const topVehiclesFallback = cars
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map((car) => ({
      title: [car.year, car.make, car.model].join(" "),
      periodViews: 0,
      priceLabel: formatCarPrice(car),
    }));

  const usedLifetimeFallback = topFromPeriod.length === 0;

  const topVehicles = topFromPeriod.length ? topFromPeriod : topVehiclesFallback;

  /** Last 7 calendar days (local) for the pulse table */
  const dailyRows = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = addDays(day, 1);
    const viewsRow = periodViews.filter((v) => {
      const t = new Date(v.viewedAt);
      return t >= day && t < next;
    }).length;
    const leadsRow = periodLeads.filter((l) => {
      const t = new Date(l.createdAt);
      return t >= day && t < next;
    }).length;
    dailyRows.push({
      dayLabel: day.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" }),
      views: viewsRow,
      leads: leadsRow,
    });
  }

  const activeListings = cars.filter((c) => c.available).length;
  const lifetimeWhatsapp = cars.reduce((a, c) => a + (c.whatsappClicks || 0), 0);
  const lifetimePrints = cars.reduce((a, c) => a + (c.printCount || 0), 0);
  const lifetimeViews = cars.reduce((a, c) => a + (c.views || 0), 0);

  const viewsMom = pctDelta(periodViews.length, prevPeriodViews.length);
  const leadsMom = pctDelta(periodLeads.length, prevPeriodLeads.length);

  const filenameSuffix = now.toISOString().split("T")[0];

  return {
    dealerName: dealer?.name || "Your showroom",
    dealerLocation: dealer?.location || "—",
    dealerCounty: dealer?.county || "",
    periodLabel: formatRangeShort(periodStart, periodEnd),
    generatedAtLabel: now.toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    filenameSuffix,

    kpis: {
      periodListingViews: periodViews.length,
      periodLeads: periodLeads.length,
      activeListings,
      viewsMom,
      leadsMom,
      lifetimeViews,
      lifetimeWhatsapp,
      lifetimePrints,
    },

    daily: dailyRows,

    topVehicles,

    usedLifetimeFallback,

    narrative: {
      headline:
        periodViews.length > 0
          ? "Buyer traffic hit your listings this week."
          : "Quiet week on detail views — push fresh photos & sharp pricing.",
      sub:
        periodLeads.length > 0
          ? `${periodLeads.length} lead${periodLeads.length === 1 ? "" : "s"} came through Welsh Motorhub in the last 7 days.`
          : "Tip: share listing links on WhatsApp status to spike intent clicks.",
    },
  };
}
