"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2, ToggleLeft, ToggleRight, X,
  MessageSquare, Car, Phone, Mail, Smartphone, Globe,
  Search, Clock, XCircle, Star,
} from "lucide-react";
import { LeadStatusBadge, LeadStatusSelect } from "@/components/admin/LeadStatusBadge";
import DeleteLeadButton from "@/components/admin/DeleteLeadButton";
import AdminCarRowActions from "@/components/admin/AdminCarRowActions";
import EmptyState from "@/components/ui/EmptyState";
import DataTableShell from "@/components/ui/DataTableShell";
import { formatListedAge } from "@/lib/format-age";

const STATUS_OPTS = [
  { v: "", l: "All" },
  { v: "live", l: "Live" },
  { v: "hidden", l: "Hidden" },
];

function fmtPrice(price) {
  if (price == null || price === 0) return "Contact for price";
  return `KES ${Number(price).toLocaleString("en-KE")}`;
}

export default function BulkActionsWrapper({
  cars, total, from, to, pages, page, search, statusFilter, order = "newest",
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const orderQS = order === "oldest" ? "&order=oldest" : "";

  const allIds = cars.map((c) => c.id);
  const allSelected = selected.size === cars.length && cars.length > 0;

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }, [allIds, allSelected]);

  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const doAction = useCallback(async (action, payload) => {
    if (selected.size === 0) return;
    const label = { toggle: "Toggle visibility", delete: "Delete", makeLive: "Make live", hide: "Hide", markSold: "Mark as sold", feature: "Feature", unfeature: "Unfeature" }[action] || action;
    if (!confirm(`${label} ${selected.size} car${selected.size > 1 ? "s" : ""}?`)) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      let res;
      if (action === "toggle" || action === "delete") {
        res = await fetch("/api/admin/cars/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action }),
        });
      } else {
        const map = { makeLive: "setLive", hide: "setHidden", markSold: "setSold", feature: "setFeatured", unfeature: "setFeatured" };
        res = await fetch("/api/admin/cars/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
            action: map[action],
            payload: action === "feature" ? { featured: true } : action === "unfeature" ? { featured: false } : undefined,
          }),
        });
      }
      if (res.ok) {
        setSelected(new Set());
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [selected, router]);

  const StatusDot = ({ car: c }) => {
    if (c.available)
      return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live</span>;
    return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />Hidden</span>;
  };

  const rowBg = (i) => i % 2 === 0 ? "bg-zinc-900/20" : "bg-transparent";

  return (
    <div className="space-y-2">
      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-2.5 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-300 tabular-nums">{selected.size}</span>
            <span className="text-zinc-400">selected</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto sm:ml-auto sm:justify-end">
            <button
              onClick={() => doAction("makeLive")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50"
            >
              <ToggleLeft size={14} /> Live
            </button>
            <button
              onClick={() => doAction("hide")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50"
            >
              <ToggleRight size={14} /> Hide
            </button>
            <button
              onClick={() => doAction("toggle")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50"
            >
              <ToggleLeft size={14} />
              {busy ? "..." : "Toggle"}
            </button>
            <button
              onClick={() => doAction("feature")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-800/40 bg-amber-950/20 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-600 hover:text-white transition-colors disabled:opacity-50"
            >
              <Star size={14} /> Feature
            </button>
            <button
              onClick={() => doAction("markSold")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-800/50 bg-red-950/30 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
            >
              <XCircle size={14} /> Sold
            </button>
            <button
              onClick={() => doAction("delete")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-800/50 bg-red-950/30 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              {busy ? "..." : "Delete"}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-2 lg:hidden">
        {cars.length === 0 ? (
          <EmptyState
            title="No listings found"
            message={search ? "Try different keywords or clear the filter." : "Add a vehicle to populate inventory."}
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
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(car.id)}
                    onChange={() => toggleOne(car.id)}
                    className="cursor-pointer accent-emerald-500 mt-1"
                  />
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <Car size={18} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/cars/${car.id}/edit`}
                      className="text-sm font-bold text-white truncate"
                    >
                      {car.year} {car.make} {car.model}
                    </Link>
                    {car.isLuxury && (
                      <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">Luxury</span>
                    )}
                    <StatusDot car={car} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 truncate">{car.variant || "\u2014"}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="font-bold text-white tabular-nums">{fmtPrice(car.price)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {car._count.leads}
                    </span>
                    <span className="ml-auto text-zinc-500">{formatListedAge(car.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800 px-3 py-2">
                <AdminCarRowActions car={car} />
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
                <PageLink href={page > 1 ? `/admin/cars?page=${page - 1}${search ? `&search=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${orderQS}` : null} label="Prev" />
                <span className="px-2 text-[11px] font-medium text-zinc-500 tabular-nums">{page} / {pages}</span>
                <PageLink href={page < pages ? `/admin/cars?page=${page + 1}${search ? `&search=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${orderQS}` : null} label="Next" />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="w-9 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="cursor-pointer accent-emerald-500"
                      title="Select all"
                    />
                  </th>
                  {["Listing", "Listed", "Leads", "Price", "Status", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {cars.map((car, i) => {
                  const thumb = car.images[0]?.url || null;
                  return (
                    <tr key={car.id} className={`transition-colors hover:bg-zinc-800/30 ${rowBg(i)}`}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(car.id)}
                          onChange={() => toggleOne(car.id)}
                          className="cursor-pointer accent-emerald-500"
                        />
                      </td>
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
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/cars/${car.id}/edit`}
                                className="text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate"
                              >
                                {car.year} {car.make} {car.model}
                              </Link>
                              {car.isLuxury && (
                                <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">Luxury</span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">{car.variant?.trim() || "\u2014"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-[11px] font-medium text-zinc-500">{formatListedAge(car.createdAt)}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                          <MessageSquare size={13} />
                          <span className="font-bold text-white tabular-nums">{car._count.leads}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm font-bold text-white tabular-nums">{fmtPrice(car.price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusDot car={car} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <AdminCarRowActions car={car} />
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
              message={search || statusFilter ? "Try clearing your filters." : "Add a vehicle to populate inventory."}
              icon={<Car size={28} className="text-zinc-500" />}
            />
          )}
        </DataTableShell>
      </div>
    </div>
  );
}

function PageLink({ href, label }) {
  if (!href) {
    return <span className="rounded-md px-3 py-1.5 text-xs font-bold text-zinc-600 opacity-40">{label}</span>;
  }
  return (
    <Link href={href} className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
      {label}
    </Link>
  );
}
