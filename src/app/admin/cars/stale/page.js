export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatListedAge } from "@/lib/format-age";
import StaleHideButton from "@/components/admin/StaleHideButton";
import DataTableShell from "@/components/ui/DataTableShell";

export const metadata = { title: "Stale Review | BIDGARI Admin" };

const DAY = 24 * 60 * 60 * 1000;
const ACTIVATION = new Date("2026-09-24T00:00:00.000Z");

function fmtPrice(price) {
  if (price == null || price === 0) return "Contact for price";
  return `KES ${Number(price).toLocaleString("en-KE")}`;
}

export default async function AdminStalePage() {
  await requireAdmin();

  const ninetyDaysAgo = new Date(Date.now() - 90 * DAY);
  const oneEightyDaysAgo = new Date(Date.now() - 180 * DAY);

  // Real 90-day engagement, from marketing_events (NOT the bot-seeded car_views).
  const recentViewRows = await db.$queryRaw`
    SELECT DISTINCT payload->>'car_id' AS "carId"
    FROM "marketing_events"
    WHERE name = 'view_car' AND "createdAt" >= ${ninetyDaysAgo}
  `;
  const recentViewedIds = recentViewRows.map((r) => r.carId).filter(Boolean);

  const [warnStale, hideCandidates, localRows] = await Promise.all([
    // Tier 1 — live >90 days with zero leads: needs your decision (hide / price-cut / keep).
    db.car.findMany({
      where: { available: true, createdAt: { lt: ninetyDaysAgo }, leads: { none: {} } },
      select: {
        id: true, year: true, make: true, model: true, variant: true,
        price: true, createdAt: true, publicSlug: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    // Tier 2 — live >180 days AND zero real views in the last 90 days: auto-hide candidates.
    db.car.findMany({
      where: {
        available: true,
        createdAt: { lt: oneEightyDaysAgo },
        ...(recentViewedIds.length ? { id: { notIn: recentViewedIds } } : {}),
      },
      select: {
        id: true, year: true, make: true, model: true, variant: true,
        price: true, createdAt: true, publicSlug: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    // Local cars — auto-expire 30 days after they were first listed (existing
    // stock re-anchored at the activation date).
    db.car.findMany({
      where: { imported: false },
      select: { createdAt: true },
    }),
  ]);

  // Local auto-expiry countdown.
  const now = Date.now();
  let due30 = 0;
  let due7 = 0;
  let earliestExpiry = null;
  for (const l of localRows) {
    const anchor = new Date(l.createdAt) > ACTIVATION ? new Date(l.createdAt) : ACTIVATION;
    const exp = anchor.getTime() + 30 * DAY;
    const daysLeft = Math.ceil((exp - now) / DAY);
    if (daysLeft <= 30) {
      due30 += 1;
      if (daysLeft <= 7) due7 += 1;
    }
    if (earliestExpiry === null || exp < earliestExpiry) earliestExpiry = exp;
  }
  const nextExpiryLabel = earliestExpiry
    ? new Date(earliestExpiry).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
    : "—";

  const renderList = (cars) =>
    cars.length === 0 ? (
      <p className="py-6 text-center text-sm text-slate-400">Nothing here — clean.</p>
    ) : (
      <DataTableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-white/40">
                {["Listing", "Price", "Listed", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {cars.map((c) => (
                <tr key={c.id} className="hover:bg-slate-100/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/cars/${c.id}/edit`} className="text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors">
                      {c.year} {c.make} {c.model}
                      {c.variant ? ` ${c.variant}` : ""}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-900 tabular-nums">{fmtPrice(c.price)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-400">{formatListedAge(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {c.publicSlug ? (
                      <Link href={`/cars/${c.publicSlug || c.id}`} target="_blank" className="text-[11px] font-bold text-slate-500 hover:text-slate-900">
                        View
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Stale listings review</h1>
        <p className="mt-1 text-[12px] text-slate-400">
          Live &gt;90 days with 0 leads → your call. Live &gt;180 days with no real views in 90 days → auto-hide candidates. Nothing is auto-deleted.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white/60 p-4">
        <h2 className="text-sm font-bold text-amber-600">Local auto-expiry countdown</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active locals</p>
            <p className="text-xl font-bold text-slate-900">{localRows.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expire in 30 days</p>
            <p className="text-xl font-bold text-slate-900">{due30}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expire in 7 days</p>
            <p className={`text-xl font-bold ${due7 > 0 ? "text-red-600" : "text-slate-900"}`}>{due7}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Next expiry</p>
            <p className="text-xl font-bold text-slate-900">{nextExpiryLabel}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Locals auto-remove 30 days after listing (existing stock re-anchored 24 Sep). Cars with leads are always kept.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-amber-600">
          Needs review · live &gt;90 days, no leads ({warnStale.length})
        </h2>
        {renderList(warnStale)}
        <div className="flex justify-end">
          <Link href="/admin/cars?order=oldest" className="rounded-md border border-slate-200 px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:text-slate-900 transition-colors">
            Open oldest-first in Inventory
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-emerald-600">
          Auto-hide candidates · live &gt;180 days, 0 views in 90 days
        </h2>
        <p className="text-[12px] text-slate-400">
          Dry-run only — nothing is hidden until you press it below. Re-shown anytime from Inventory (Status: Hidden).
        </p>
        {renderList(hideCandidates)}
        <div className="flex justify-end">
          <StaleHideButton ids={hideCandidates.map((c) => c.id)} />
        </div>
      </section>
    </div>
  );
}