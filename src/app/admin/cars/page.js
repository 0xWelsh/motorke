// src/app/admin/cars/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCarPrice } from "@/lib/utils";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import ClearAllButton from "@/components/ClearAllButton";
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
import EmptyState from "@/components/ui/EmptyState";
import DataTableShell from "@/components/ui/DataTableShell";

export const metadata = { title: "Cars Inventory — Welsh Motorhub Admin" };

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
          { plate: { contains: search, mode: "insensitive" } },
          { vin: { contains: search, mode: "insensitive" } },
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

  return (
    <div className="mk-page-shell animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Hero */}
      <section className="mb-8 rounded-2xl border border-[#e7e7e9] bg-white px-6 py-7 dark:border-zinc-800 dark:bg-[#111111] lg:mb-10 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#2F855A]/10 blur-3xl dark:bg-[#2F855A]/5"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-[#2F855A] shadow-[0_0_12px_rgba(47,133,90,0.65)]"
                aria-hidden
              />
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                Inventory
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Cars</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
              Search and manage listings across all dealers. Pagination shows {limit} rows per page. Export pulls the{' '}
              <span className="font-semibold text-slate-800 dark:text-zinc-200">current results</span>.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-nowrap xl:justify-end">
            {/* One-line stats (mobile + desktop aligned) */}
            <div className="flex items-stretch gap-2 w-full sm:max-w-[22rem]">
              {[
                { label: "Matches", value: total, tone: "text-slate-900 dark:text-white" },
                { label: "Live", value: totalLive, tone: "text-emerald-700 dark:text-emerald-400" },
                { label: "Hidden", value: totalHidden, tone: "text-slate-600 dark:text-zinc-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex-1 rounded-xl border border-[#e7e7e9] bg-[#fafafa] px-2.5 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <p className={`text-lg font-black tabular-nums sm:text-xl ${s.tone}`}>{s.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <ExportButton
                label="CSV"
                filename="welsh-motorhub-inventory.csv"
                data={cars.map((c) => ({
                  ID: c.id,
                  Make: c.make,
                  Model: c.model,
                  Year: c.year,
                  Price: c.price,
                  Dealer: c.dealer.name,
                  Leads: c._count.leads,
                  Status: c.available ? "Live" : "Hidden",
                  CreatedAt: c.createdAt,
                }))}
              />
              <ClearAllButton />
              <Link
                href="/admin/cars/new"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2F855A] px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#38A169] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F855A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101012]"
              >
                <Plus size={18} strokeWidth={2.25} /> New car
              </Link>
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
            placeholder="Make, model, VIN or plate..."
            autoComplete="off"
            className="peer w-full rounded-xl border border-[#e2e2e6] bg-[#fafafa] py-3 pl-11 pr-24 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2F855A]/45 focus:bg-white focus:ring-2 focus:ring-[#2F855A]/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
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

      {/* Table */}
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
                            href={`/cars/${car.id}`}
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
                            <span>{car.plate?.trim() || "—"}</span>
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
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 sm:opacity-100 md:opacity-70 md:group-hover:opacity-100">
                        <Link
                          href={`/cars/${car.id}`}
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
                            title={car.available ? "Hide listing" : "Publish listing"}
                            aria-label={car.available ? "Hide listing" : "Publish listing"}
                          >
                            {car.available ? (
                              <ToggleRight size={16} strokeWidth={2.25} />
                            ) : (
                              <ToggleLeft size={16} strokeWidth={2.25} />
                            )}
                          </button>
                        </form>
                        <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Permanently delete this car from inventory?" />
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

      {pages > 1 && (
        <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Pagination">
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
