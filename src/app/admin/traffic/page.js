export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Eye, MousePointerClick, BarChart3, ExternalLink } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { carListingPath } from "@/lib/car-listing-url";
import { classifyViewSource, viewSourceLabel } from "@/lib/view-source";
import { getSiteOrigin } from "@/lib/site-url";

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
    carDetailViews30d,
    leads7d,
    leads30d,
    topPages,
    topSources,
    topCarsRaw,
    coreEvents,
  ] = await Promise.all([
    db.marketingEvent.count({ where: { name: "page_view", createdAt: { gte: start7d } } }),
    db.marketingEvent.count({ where: { name: "page_view", createdAt: { gte: start30d } } }),
    db.marketingEvent.count({ where: { name: "cars_listing_view", createdAt: { gte: start7d } } }),
    db.marketingEvent.count({ where: { name: "cars_listing_view", createdAt: { gte: start30d } } }),
    // Real detail-page loads only — NOT the car_views table, which the
    // view-organic cron seeds with 80-150 synthetic rows per car per day.
    db.marketingEvent.count({ where: { name: "view_car", createdAt: { gte: start7d } } }),
    db.marketingEvent.count({ where: { name: "view_car", createdAt: { gte: start30d } } }),
    // Real leads (web form + WhatsApp/call taps). Not marketing events, so
    // it never goes stale when the funnel event names change.
    db.lead.count({ where: { createdAt: { gte: start7d } } }),
    db.lead.count({ where: { createdAt: { gte: start30d } } }),
    db.marketingEvent.groupBy({
      by: ["path"],
      where: { name: "page_view", createdAt: { gte: start7d }, path: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    }),
    // Raw HTTP referrers captured on real detail-page loads. Classified into
    // source buckets in JS below (Direct / On-site / Google / Facebook ...).
    db.$queryRaw`
      SELECT COALESCE(payload->>'referrer', '') AS referrer, COUNT(*)::int AS count
      FROM "marketing_events"
      WHERE name = 'view_car' AND "createdAt" >= ${start7d}
      GROUP BY payload->>'referrer'
      ORDER BY count DESC
    `,
    db.$queryRaw`
      SELECT payload->>'car_id' AS "carId", COUNT(*)::int AS count
      FROM "marketing_events"
      WHERE name = 'view_car' AND "createdAt" >= ${start7d}
      GROUP BY payload->>'car_id'
      ORDER BY count DESC
      LIMIT 10
    `,
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
    car: carMap[row.carId] || null,
    count: row.count,
  }));

  // Re-aggregate raw referrer strings into the fixed source buckets so the
  // report stays readable and stable across small referrer variations.
  const sourceBuckets = new Map();
  for (const row of topSources) {
    const bucket = row.referrer ? classifyViewSource(row.referrer, getSiteOrigin()) : "direct";
    sourceBuckets.set(bucket, (sourceBuckets.get(bucket) || 0) + row.count);
  }
  const trafficSources = [...sourceBuckets.entries()]
    .map(([source, count]) => ({ source: viewSourceLabel(source), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const listingViews30dCount = listingViews30d;
  const eventMap = Object.fromEntries(coreEvents.map((e) => [e.name, e._count._all]));
  const contactTaps7d = (eventMap.open_whatsapp || 0) + (eventMap.open_call || 0);

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
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-secondary transition hover:border-emerald-500/40 border-border bg-surface text-text"
          >
            <ExternalLink size={14} /> JSON export
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Site page views (7d)", value: pageViews7d, sub: `${fmt(pageViews30d)} in 30d` },
          { label: "Inventory page views (7d)", value: listingViews7d, sub: `${fmt(listingViews30dCount)} in 30d` },
          { label: "Car detail views (7d)", value: carDetailViews7d, sub: `${fmt(carDetailViews30d)} in 30d · real events` },
          {
            label: "Leads (7d)",
            value: leads7d,
            sub: `${fmt(leads30d)} in 30d · ${fmt(contactTaps7d)} WhatsApp/call taps`,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-surface px-4 py-4 border-border bg-[var(--bg)]"
          >
            <p className="text-xs font-medium text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-text text-text">{fmt(card.value)}</p>
            <p className="mt-1 text-xs text-muted">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 border-border bg-[var(--bg)]">
          <div className="mb-4 flex items-center gap-2">
            <Eye size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-text text-text">Top pages (7 days)</h3>
          </div>
          <ul className="space-y-2">
            {topPages.length === 0 ? (
              <li className="text-sm text-muted">No page views recorded yet.</li>
            ) : (
              topPages.map((row) => (
                <li
                  key={row.path}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate font-medium text-secondary">
                    {row.path || "/"}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">{fmt(row._count._all)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 border-border bg-[var(--bg)]">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-text text-text">Listing traffic sources (7d)</h3>
          </div>
          <ul className="space-y-2">
            {trafficSources.length === 0 ? (
              <li className="text-sm text-muted">No referrer data yet.</li>
            ) : (
              trafficSources.map((row) => (
                <li key={row.source} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-secondary">
                    {row.source}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">{fmt(row.count)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface border-border bg-[var(--bg)] overflow-hidden">
        <div className="border-b border-border px-5 py-4 border-border">
          <div className="flex items-center gap-2">
            <MousePointerClick size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-text text-text">Most viewed listings (7 days)</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-hover text-xs uppercase tracking-wide text-muted border-border bg-surface">
                <th className="px-5 py-3 font-semibold">Vehicle</th>
                <th className="px-5 py-3 font-semibold">Dealer</th>
                <th className="px-5 py-3 font-semibold text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border divide-border">
              {topCars.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-muted">
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
                          className="font-medium text-text hover:text-emerald-700 text-text"
                          target="_blank"
                        >
                          {row.car.year} {row.car.make} {row.car.model}
                        </Link>
                      ) : (
                        <span className="text-muted">{row.carId}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted text-ghost">
                      {row.car?.dealer?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-text text-text">
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
