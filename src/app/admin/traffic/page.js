export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Eye, MousePointerClick, BarChart3, ExternalLink } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { carListingPath } from "@/lib/car-listing-url";

export const metadata = { title: "Traffic | BIDGARI Admin" };

function fmt(n) {
  return new Intl.NumberFormat("en-KE").format(n ?? 0);
}

export default async function AdminTrafficPage() {
  await requireAdmin();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const start7d = new Date(now - 7 * day);
  const start30d = new Date(now - 30 * day);

  const [
    pageViews7d,
    pageViews30d,
    listingViews7d,
    listingViews30d,
    carDetailViews7d,
    topPages,
    topSources,
    topCarsRaw,
    coreEvents,
  ] = await Promise.all([
    db.marketingEvent.count({ where: { name: "page_view", createdAt: { gte: start7d } } }),
    db.marketingEvent.count({ where: { name: "page_view", createdAt: { gte: start30d } } }),
    db.marketingEvent.count({ where: { name: "cars_listing_view", createdAt: { gte: start7d } } }),
    db.marketingEvent.count({ where: { name: "cars_listing_view", createdAt: { gte: start30d } } }),
    db.carView.count({ where: { viewedAt: { gte: start7d } } }),
    db.marketingEvent.groupBy({
      by: ["path"],
      where: { name: "page_view", createdAt: { gte: start7d }, path: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    }),
    db.carView.groupBy({
      by: ["source"],
      where: { viewedAt: { gte: start7d } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    db.carView.groupBy({
      by: ["carId"],
      where: { viewedAt: { gte: start7d } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    db.marketingEvent.groupBy({
      by: ["name"],
      where: {
        createdAt: { gte: start7d },
        name: {
          in: [
            "page_view",
            "cars_listing_view",
            "view_car_click",
            "open_whatsapp",
            "open_call",
            "submit_lead",
          ],
        },
      },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  const carIds = topCarsRaw.map((row) => row.carId);
  const cars = carIds.length
    ? await db.car.findMany({
        where: { id: { in: carIds } },
        select: {
          id: true,
          publicSlug: true,
          year: true,
          make: true,
          model: true,
          dealer: { select: { name: true } },
        },
      })
    : [];
  const carMap = Object.fromEntries(cars.map((c) => [c.id, c]));
  const topCars = topCarsRaw.map((row) => ({
    ...row,
    car: carMap[row.carId],
    count: row._count._all,
  }));

  const listingViews30dCount = listingViews30d;
  const eventMap = Object.fromEntries(coreEvents.map((e) => [e.name, e._count._all]));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 space-y-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Website traffic"
        description="Page views, listing engagement, and car detail views. Includes guests and signed-in users."
        actions={
          <Link
            href="/api/admin/tracking/summary"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <ExternalLink size={14} /> JSON export
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Site page views (7d)", value: pageViews7d, sub: `${fmt(pageViews30d)} in 30d` },
          { label: "Inventory page views (7d)", value: listingViews7d, sub: `${fmt(listingViews30dCount)} in 30d` },
          { label: "Car detail views (7d)", value: carDetailViews7d, sub: "Deduplicated per session" },
          {
            label: "Leads submitted (7d)",
            value: eventMap.submit_lead || 0,
            sub: "Form + tracked intents",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{fmt(card.value)}</p>
            <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-2">
            <Eye size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Top pages (7 days)</h3>
          </div>
          <ul className="space-y-2">
            {topPages.length === 0 ? (
              <li className="text-sm text-slate-500">No page views recorded yet.</li>
            ) : (
              topPages.map((row) => (
                <li
                  key={row.path}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                    {row.path || "/"}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-500">{fmt(row._count._all)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Listing traffic sources (7d)</h3>
          </div>
          <ul className="space-y-2">
            {topSources.length === 0 ? (
              <li className="text-sm text-slate-500">No referrer data yet.</li>
            ) : (
              topSources.map((row) => (
                <li key={row.source || "unknown"} className="flex items-center justify-between gap-3 text-sm">
                  <span className="capitalize font-medium text-slate-700 dark:text-slate-200">
                    {row.source || "direct"}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-500">{fmt(row._count._all)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MousePointerClick size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Most viewed listings (7 days)</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                <th className="px-5 py-3 font-semibold">Vehicle</th>
                <th className="px-5 py-3 font-semibold">Dealer</th>
                <th className="px-5 py-3 font-semibold text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {topCars.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate-500">
                    No listing views in the last 7 days.
                  </td>
                </tr>
              ) : (
                topCars.map((row) => (
                  <tr key={row.carId}>
                    <td className="px-5 py-3">
                      {row.car ? (
                        <Link
                          href={carListingPath(row.car || { id: row.carId })}
                          className="font-medium text-slate-900 hover:text-emerald-700 dark:text-white"
                          target="_blank"
                        >
                          {row.car.year} {row.car.make} {row.car.model}
                        </Link>
                      ) : (
                        <span className="text-slate-500">{row.carId}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {row.car?.dealer?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                      {fmt(row.count)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

