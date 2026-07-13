export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCarPrice } from "@/lib/utils";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import {
  Search,
  ChevronRight,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Car,
  MessageSquare,
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";
import AdminCarsDangerZone from "@/components/admin/AdminCarsDangerZone";
import EmptyState from "@/components/ui/EmptyState";
import DataTableShell from "@/components/ui/DataTableShell";
import { carListingPath } from "@/lib/car-listing-url";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import TikTokVideoButton from "@/components/admin/TikTokVideoButton";

export const metadata = { title: "Cars Inventory | BIDGARI Admin" };

function carsHref(opts = {}) {
  const p = new URLSearchParams();
  if (opts.page > 1) p.set("page", String(opts.page));
  if (opts.search) p.set("search", opts.search);
  if (opts.status) p.set("status", opts.status);
  const qs = p.toString();
  return qs ? `/admin/cars?${qs}` : "/admin/cars";
}

const STATUS_OPTS = [
  { v: "", l: "All" },
  { v: "live", l: "Live" },
  { v: "hidden", l: "Hidden" },
];

export default async function AdminCarsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const search = sp.search || "";
  const statusFilter = sp.status || "";
  const successMsg = sp.success || "";
  const errorMsg = sp.error || "";
  const page = parseInt(sp.page || "1", 10);
  const limit = 20;

  const where = {};
  if (search) {
    where.OR = [
      { make: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { variant: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (statusFilter === "live") where.available = true;
  if (statusFilter === "hidden") where.available = false;

  const [cars, total, totalLive, totalHidden] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        _count: { select: { leads: true } },
        images: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.car.count({ where }),
    db.car.count({ where: { ...where, available: true } }),
    db.car.count({ where: { ...where, available: false } }),
  ]);

  const pages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const exportRows = cars.map((c) => ({
    ID: c.id,
    Make: c.make,
    Model: c.model,
    Year: c.year,
    Price: c.price,
    Leads: c._count.leads,
    Status: c.available ? "Live" : isInSoldGracePeriod(c) ? "Sold" : "Hidden",
    CreatedAt: c.createdAt,
  }));

  const StatusDot = ({ car }) => {
    if (car.available)
      return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live</span>;
    if (isInSoldGracePeriod(car))
      return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Sold</span>;
    return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />Hidden</span>;
  };

  const rowBg = (i) => i % 2 === 0 ? "bg-zinc-900/20" : "bg-transparent";

  return (
    <div className="space-y-4">

      {successMsg === "wa-posted" && (
        <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          Posted to WhatsApp Channel successfully
        </div>
      )}
      {errorMsg === "wa-post-failed" && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          Failed to post to WhatsApp Channel
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Inventory</h1>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
            <span>{total} total</span>
            <span className="text-emerald-500">{totalLive} live</span>
            <span>{totalHidden} hidden</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/cars/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            <Plus size={15} /> New car
          </Link>
          <ExportButton
            label="Export"
            filename="welsh-motorhub-inventory.csv"
            data={exportRows}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
          />
        </div>
      </div>

      {/* Search + Filter */}
      <form
        action="/admin/cars"
        method="GET"
        className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Make, model, variant, or description…"
              autoComplete="off"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:bg-zinc-950"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-medium text-zinc-300 outline-none cursor-pointer focus:border-emerald-500/50"
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            Search
          </button>
          {(search || statusFilter) && (
            <Link
              href="/admin/cars"
              className="rounded-md border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <AdminCarsDangerZone />

      {/* Mobile */}
      <div className="space-y-2 lg:hidden">
        {cars.length === 0 ? (
          <EmptyState
            title="No listings found"
            message={search ? "Try different keywords or clear the filter." : "Add a vehicle to populate inventory."}
            actionHref="/admin/cars/new"
            actionLabel="Add car"
            secondaryHref={search ? "/admin/cars" : null}
            secondaryLabel={search ? "Clear search" : null}
            icon={<Car size={28} className="text-zinc-500" />}
          />
        ) : (
          <div className="text-[11px] text-zinc-500 px-1">{total === 0 ? "No listings" : `Showing ${from}–${to} of ${total}`}</div>
        )}
        {cars.map((car) => {
          const thumb = car.images[0]?.url || null;
          return (
            <div key={car.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60">
              <div className="flex gap-3 p-3">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                      <Car size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={carListingPath(car)}
                      target="_blank"
                      className="text-sm font-bold text-white truncate"
                    >
                      {car.year} {car.make} {car.model}
                    </Link>
                    <StatusDot car={car} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 truncate">{car.variant || "—"}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="font-bold text-white tabular-nums">{formatCarPrice(car.price)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {car._count.leads}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-t border-zinc-800 px-3 py-2">
                <Link
                  href={carListingPath(car)}
                  target="_blank"
                  className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-zinc-400 hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                </Link>
                <Link
                  href={`/admin/cars/${car.id}/edit`}
                  className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-zinc-400 hover:text-white transition-colors"
                >
                  <Edit3 size={14} />
                </Link>
                <form action="/api/whatsapp-channel/post" method="POST" className="inline">
                  <input type="hidden" name="carId" value={car.id} />
                  <button
                    type="submit"
                    title="Post to WhatsApp Channel"
                    className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <MessageSquare size={14} />
                  </button>
                </form>
                <form action={`/api/admin/cars/${car.id}/toggle-visibility`} method="POST" className="inline">
                  <button
                    type="submit"
                    className={`rounded-md border p-1.5 transition-colors ${
                      car.available
                        ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/60"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {car.available ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                </form>
                <DeleteButton
                  compact
                  action={`/api/admin/cars/${car.id}/delete`}
                  message="Permanently delete this car from inventory?"
                />
                <TikTokVideoButton car={car} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <DataTableShell>
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2.5">
            <p className="text-[11px] font-semibold text-zinc-500">
              {total === 0 ? "No listings" : (
                <>Showing <span className="text-white">{from}–{to}</span> of <span className="text-white">{total}</span></>
              )}
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <PageLink
                  href={page > 1 ? carsHref({ page: page - 1, search, status: statusFilter }) : null}
                  label="Prev"
                />
                <span className="px-2 text-[11px] font-medium text-zinc-500 tabular-nums">{page} / {pages}</span>
                <PageLink
                  href={page < pages ? carsHref({ page: page + 1, search, status: statusFilter }) : null}
                  label="Next"
                />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  {["Listing", "Leads", "Price", "Status", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {cars.map((car, i) => {
                  const thumb = car.images[0]?.url || null;
                  return (
                    <tr key={car.id} className={`transition-colors hover:bg-zinc-800/30 ${rowBg(i)}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-[4.25rem] shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                            {thumb ? (
                              <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                <Car size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={carListingPath(car)}
                              target="_blank"
                              className="text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate block"
                            >
                              {car.year} {car.make} {car.model}
                            </Link>
                            <p className="text-[11px] text-zinc-500 truncate">{car.variant?.trim() || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                          <MessageSquare size={13} />
                          <span className="font-bold text-white tabular-nums">{car._count.leads}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm font-bold text-white tabular-nums">{formatCarPrice(car)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusDot car={car} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionButton href={carListingPath(car)} external title="View live">
                            <ExternalLink size={14} />
                          </ActionButton>
                          <ActionButton href={`/admin/cars/${car.id}/edit`} title="Edit">
                            <Edit3 size={14} />
                          </ActionButton>
                          <form action="/api/whatsapp-channel/post" method="POST" className="inline">
                            <input type="hidden" name="carId" value={car.id} />
                            <button
                              type="submit"
                              title="Post to WhatsApp Channel"
                              className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <MessageSquare size={14} />
                            </button>
                          </form>
                          <form action={`/api/admin/cars/${car.id}/toggle-visibility`} method="POST" className="inline">
                            <button
                              type="submit"
                              className={`rounded-md border p-1.5 transition-colors ${
                                car.available
                                  ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/60"
                                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              }`}
                              title={car.available ? "Mark as sold" : "Mark as live"}
                            >
                              {car.available ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>
                          </form>
                          <DeleteButton compact action={`/api/admin/cars/${car.id}/delete`} message="Permanently delete this car from inventory?" />
                          <TikTokVideoButton car={car} compact />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {cars.length === 0 && (
            <EmptyState
              title="No listings found"
              message={search ? "Try different keywords or clear the filter." : "Add a vehicle to populate inventory."}
              actionHref="/admin/cars/new"
              actionLabel="Add car"
              secondaryHref={search ? "/admin/cars" : null}
              secondaryLabel={search ? "Clear search" : null}
              icon={<Car size={28} className="text-zinc-500" />}
            />
          )}
        </DataTableShell>
      </div>

      {/* Page links bottom (mobile) */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 lg:hidden">
          <PageLink
            href={page > 1 ? carsHref({ page: page - 1, search, status: statusFilter }) : null}
            label="Prev"
          />
          <span className="text-xs text-zinc-500 tabular-nums">{page} / {pages}</span>
          <PageLink
            href={page < pages ? carsHref({ page: page + 1, search, status: statusFilter }) : null}
            label="Next"
          />
        </div>
      )}

      {/* Desktop page pills */}
      {pages > 1 && (
        <div className="hidden lg:flex items-center justify-center gap-1.5">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={carsHref({ page: p, search, status: statusFilter })}
              className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md text-xs font-bold transition-colors ${
                p === page
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PageLink({ href, label }) {
  if (!href) {
    return <span className="rounded-md px-3 py-1.5 text-xs font-bold text-zinc-600 opacity-40">{label}</span>;
  }
  return (
    <Link
      href={href}
      className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
    >
      {label}
    </Link>
  );
}

function ActionButton({ href, external, title, children }) {
  const cls = "rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors inline-flex";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} title={title}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} title={title}>
      {children}
    </Link>
  );
}
