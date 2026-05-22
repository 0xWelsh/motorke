// src/app/admin/cars/page.js
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

export const metadata = { title: "Cars Inventory | Welsh Motorhub Admin" };

/** Build `/admin/cars` href with consistent query-string handling */
function adminCarsHref(search, pageNum = 1) {
  const p = new URLSearchParams();
  if (pageNum > 1) p.set("page", String(pageNum));
  if (search) p.set("search", search);
  const qs = p.toString();
  return qs ? `/admin/cars?${qs}` : "/admin/cars";
}

export default async function AdminCarsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const search = sp.search || "";
  const page = parseInt(sp.page || "1", 10);
  const limit = 20;

  const where = search
    ? {
        OR: [
          { make: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
          { variant: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const mergeAvailability = (available) =>
    Object.keys(where).length ? { AND: [where, { available }] } : { available };

  const [cars, total, totalLive, totalHidden] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        dealer: { select: { name: true } },
        _count: { select: { leads: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.car.count({ where }),
    db.car.count({ where: mergeAvailability(true) }),
    db.car.count({ where: mergeAvailability(false) }),
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
    Dealer: c.dealer.name,
    Leads: c._count.leads,
    Status: c.available ? "Live" : isInSoldGracePeriod(c) ? "Sold" : "Hidden",
    CreatedAt: c.createdAt,
  }));

  return (
    <div className="mk-page-shell animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-full overflow-x-hidden">
      {/* Hero */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-[#e7e7e9] bg-white px-4 py-5 dark:border-zinc-800 dark:bg-[#111111] sm:mb-8 sm:px-6 sm:py-7 lg:px-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#2F855A]/10 blur-3xl dark:bg-[#2F855A]/5"
          aria-hidden
        />
        <div className="relative space-y-5 lg:flex lg:items-end lg:justify-between lg:gap-8 lg:space-y-0">
          <div className="min-w-0 lg:flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-[#2F855A] shadow-[0_0_12px_rgba(47,133,90,0.65)]"
                aria-hidden
              />
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                Inventory
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">Cars</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
              {limit} per page · export uses current filter
            </p>
          </div>

          <div className="w-full space-y-3 lg:max-w-sm lg:shrink-0">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Matches", value: total, tone: "text-slate-900 dark:text-white" },
                { label: "Live", value: totalLive, tone: "text-emerald-700 dark:text-emerald-400" },
                { label: "Hidden", value: totalHidden, tone: "text-slate-600 dark:text-zinc-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-[#e7e7e9] bg-[#fafafa] px-2 py-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <p className={`text-lg font-black tabular-nums leading-none ${s.tone}`}>{s.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                href="/admin/cars/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F855A] px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#38A169] sm:col-span-2 lg:col-span-1"
              >
                <Plus size={18} strokeWidth={2.25} /> New car
              </Link>
              <ExportButton
                label="Export CSV"
                filename="welsh-motorhub-inventory.csv"
                data={exportRows}
                className="w-full justify-center py-3.5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <form
        action="/admin/cars"
        method="GET"
        className="mb-6 rounded-2xl border border-[#e7e7e9] bg-white p-4 dark:border-zinc-800 dark:bg-[#111111] sm:p-5"
      >
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors peer-focus-visible:text-[#2F855A]"
            aria-hidden
          />
          <input
            name="search"
            defaultValue={search}
            placeholder="Make, model, variant, or description…"
            autoComplete="off"
            className="peer w-full rounded-xl border border-[#e2e2e6] bg-[#fafafa] py-3 pl-11 pr-[5.5rem] text-base md:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2F855A]/45 focus:bg-white focus:ring-2 focus:ring-[#2F855A]/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 inline-flex min-h-[2.25rem] -translate-y-1/2 items-center rounded-lg bg-[#111111] px-4 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
          >
            Search
          </button>
        </div>
        {search && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <span>
              Filtering: <strong className="text-slate-900 dark:text-white">{search}</strong>
            </span>
            <Link href="/admin/cars" className="font-semibold text-[#2F855A] hover:underline">
              Clear
            </Link>
          </div>
        )}
      </form>

      <AdminCarsDangerZone />

      {/* Mobile inventory cards */}
      <div className="mb-6 space-y-3 lg:hidden">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-zinc-500">
          {total === 0 ? "No listings" : `Showing ${from}–${to} of ${total}`}
        </p>
        {cars.length === 0 ? (
          <EmptyState
            title="No listings found"
            message={search ? "Try different keywords or clear the filter." : "Add a vehicle to populate inventory."}
            actionHref="/admin/cars/new"
            actionLabel="Add car"
            secondaryHref={search ? "/admin/cars" : null}
            secondaryLabel={search ? "Clear search" : null}
            icon={<Car size={28} className="text-slate-400 dark:text-zinc-500" />}
          />
        ) : (
          cars.map((car) => {
            const thumb = car.images[0]?.url || null;
            return (
              <article
                key={car.id}
                className="overflow-hidden rounded-2xl border border-[#e7e7e9] bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111111]"
              >
                <div className="flex gap-3 p-3">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-[#ececf0] bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800">
                    {thumb ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Car size={22} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={carListingPath(car)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white"
                      >
                        {car.year} {car.make} {car.model}
                      </Link>
                      {car.available ? (
                        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-400">
                          Live
                        </span>
                      ) : isInSoldGracePeriod(car) ? (
                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300">
                          Sold
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-600 dark:text-zinc-400">{car.dealer.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-black tabular-nums text-slate-900 dark:text-white">{formatCarPrice(car.price)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare size={12} aria-hidden />
                        {car._count.leads} leads
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-[#ececf0] bg-[#fafafa] px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={carListingPath(car)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[#ececf0] bg-white p-2.5 text-slate-600 dark:border-zinc-700 dark:bg-zinc-900"
                      title="View live"
                    >
                      <ExternalLink size={16} strokeWidth={2} />
                    </Link>
                    <Link
                      href={`/admin/cars/${car.id}/edit`}
                      className="rounded-lg border border-[#ececf0] bg-white p-2.5 text-slate-600 dark:border-zinc-700 dark:bg-zinc-900"
                      title="Edit"
                    >
                      <Edit3 size={16} strokeWidth={2} />
                    </Link>
                    <form action={`/api/admin/cars/${car.id}/toggle-visibility`} method="POST" className="inline">
                      <button
                        type="submit"
                        className={`rounded-lg border p-2.5 ${
                          car.available
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}
                        aria-label={car.available ? "Mark as sold" : "Mark as live"}
                      >
                        {car.available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </form>
                  </div>
                  <DeleteButton
                    compact
                    action={`/api/admin/cars/${car.id}/delete`}
                    message="Permanently delete this car from inventory?"
                  />
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
      <DataTableShell>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf0] px-5 py-3.5 dark:border-zinc-800">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-zinc-500">
            {total === 0 ? (
              "No listings"
            ) : (
              <>
                Showing <span className="text-slate-900 dark:text-white">{from}–{to}</span> of{" "}
                <span className="text-slate-900 dark:text-white">{total}</span>
              </>
            )}
          </p>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              {page <= 1 ? (
                <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide opacity-35 text-slate-400">
                  Prev
                </span>
              ) : (
                <Link
                  href={adminCarsHref(search, page - 1)}
                  className="inline-flex items-center rounded-lg border border-[#e2e2e6] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:border-[#2F855A] hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  Prev
                </Link>
              )}
              <span className="px-2 text-[11px] font-semibold tabular-nums text-slate-600 dark:text-zinc-400">
                Page {page} / {pages}
              </span>
              {page >= pages ? (
                <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide opacity-35 text-slate-400">
                  Next
                </span>
              ) : (
                <Link
                  href={adminCarsHref(search, page + 1)}
                  className="inline-flex items-center rounded-lg border border-[#e2e2e6] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:border-[#2F855A] hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ececf0] bg-[#fafafa] dark:border-zinc-800 dark:bg-zinc-900/90">
                {["Listing", "Dealer", "Leads", "Price", "Status", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececf0] dark:divide-zinc-800">
              {cars.map((car) => {
                const thumb = car.images[0]?.url || null;
                return (
                  <tr key={car.id} className="group transition-colors hover:bg-[#f9fafb] dark:hover:bg-[#151515]/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-[4.75rem] shrink-0 overflow-hidden rounded-lg border border-[#ececf0] bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800">
                          {thumb ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={thumb}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Car size={18} strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={carListingPath(car)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-1 text-[13px] font-bold leading-snug text-slate-900 transition hover:text-[#2F855A] dark:text-white"
                          >
                            {car.year} {car.make} {car.model}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-500">
                            <span className="tabular-nums">#{car.id.slice(-6)}</span>
                            <span aria-hidden className="opacity-40">
                              ·
                            </span>
                            <span className="line-clamp-1 normal-case">{car.variant?.trim() || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[200px] px-5 py-4">
                      <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-zinc-200">{car.dealer.name}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                        <MessageSquare size={14} className="opacity-85" aria-hidden />
                        <span className="text-[13px] font-bold tabular-nums text-slate-900 dark:text-white">{car._count.leads}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-[13px] font-black tabular-nums text-slate-900 dark:text-white">{formatCarPrice(car)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {car.available ? (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-400">
                          Live
                        </span>
                      ) : isInSoldGracePeriod(car) ? (
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300">
                          Sold
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 sm:opacity-100 md:opacity-70 md:group-hover:opacity-100">
                        <Link
                          href={carListingPath(car)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-[#ececf0] bg-white p-2 text-slate-600 transition hover:border-[#2F855A] hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                          title="View live listing"
                        >
                          <ExternalLink size={15} strokeWidth={2} />
                        </Link>
                        <Link
                          href={`/admin/cars/${car.id}/edit`}
                          className="rounded-xl border border-[#ececf0] bg-white p-2 text-slate-600 transition hover:border-slate-900 hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit3 size={15} strokeWidth={2} />
                        </Link>
                        <form action={`/api/admin/cars/${car.id}/toggle-visibility`} method="POST" className="inline">
                          <button
                            type="submit"
                            className={`rounded-xl border p-2 transition ${
                              car.available
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                                : "border-slate-200 bg-[#f6f7f9] text-slate-700 hover:bg-white hover:border-[#ddd4c8] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                            title={car.available ? "Mark as sold" : "Mark as live"}
                            aria-label={car.available ? "Mark as sold" : "Mark as live"}
                          >
                            {car.available ? (
                              <ToggleRight size={16} strokeWidth={2.25} />
                            ) : (
                              <ToggleLeft size={16} strokeWidth={2.25} />
                            )}
                          </button>
                        </form>
                        <DeleteButton compact action={`/api/admin/cars/${car.id}/delete`} message="Permanently delete this car from inventory?" />
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
            icon={<Car size={28} className="text-slate-400 dark:text-zinc-500" />}
          />
        )}
      </DataTableShell>
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={adminCarsHref(search, page - 1)}
                  className="flex min-w-[8rem] items-center justify-center gap-1 rounded-xl border border-[#ddd4c8] bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-[#2F855A] hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <ChevronRight className="-scale-x-100" size={14} />
              Previous
            </Link>
          ) : (
            <span className="flex min-w-[8rem] items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide opacity-35 text-slate-400 pointer-events-none">
              <ChevronRight className="-scale-x-100" size={14} />
              Previous
            </span>
          )}
          <div className="hidden max-w-full flex-wrap justify-center gap-1 sm:flex">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={adminCarsHref(search, p)}
                className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl text-[13px] font-bold transition ${
                  p === page
                    ? "bg-[#2F855A] text-white"
                    : "border border-[#ddd4c8] bg-white text-slate-700 hover:border-[#2F855A] hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
          <span className="w-full text-center text-[11px] font-semibold text-slate-500 sm:hidden">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              href={adminCarsHref(search, page + 1)}
              className="flex min-w-[8rem] items-center justify-center gap-1 rounded-xl border border-[#ddd4c8] bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-[#2F855A] hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Next
              <ChevronRight size={14} />
            </Link>
          ) : (
            <span className="pointer-events-none flex min-w-[8rem] items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide opacity-35 text-slate-400">
              Next
              <ChevronRight size={14} />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
