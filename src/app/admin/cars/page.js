export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Search,
  Plus,
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";
import AdminCarsDangerZone from "@/components/admin/AdminCarsDangerZone";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import AdminCarsBulkActions from "@/components/admin/AdminCarsBulkActions";

export const metadata = { title: "Cars Inventory | BIDGARI Admin" };

function carsHref(opts = {}) {
  const p = new URLSearchParams();
  if (opts.page > 1) p.set("page", String(opts.page));
  if (opts.search) p.set("search", opts.search);
  if (opts.status) p.set("status", opts.status);
  if (opts.order) p.set("order", opts.order);
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
  const order = sp.order === "oldest" ? "oldest" : "newest";
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
      orderBy: { createdAt: order === "oldest" ? "asc" : "desc" },
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Inventory</h1>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
            <span>{total} total</span>
            <span className="text-emerald-500">{totalLive} live</span>
            <span>{totalHidden} hidden</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/admin/cars/stale"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-800/40 bg-amber-950/20 px-3.5 py-2 text-[11px] font-bold text-amber-400 hover:bg-amber-900/30 transition-colors"
          >
            Stale review
          </Link>
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Make, model, variant, or description…"
              autoComplete="off"
              className="w-full min-w-0 rounded-md border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:bg-zinc-950"
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
          <select
            name="order"
            defaultValue={order}
            className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-medium text-zinc-300 outline-none cursor-pointer focus:border-emerald-500/50"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
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

      <AdminCarsBulkActions
        cars={cars}
        total={total}
        from={from}
        to={to}
        pages={pages}
        page={page}
        search={search}
        statusFilter={statusFilter}
        order={order}
      />

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
