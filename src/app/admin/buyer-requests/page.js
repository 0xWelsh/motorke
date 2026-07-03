export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import BuyerRequestAdminRowActions from "@/components/admin/BuyerRequestAdminRowActions";
import DataTableShell from "@/components/ui/DataTableShell";
import EmptyState from "@/components/ui/EmptyState";
import { ClipboardList, MessageCircle } from "lucide-react";
import { FUEL_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Buyer Requests | Welsh Motorhub Admin" };

function statusDot(status) {
  const map = {
    OPEN: "bg-emerald-500",
    MATCHED: "bg-sky-500",
    CLOSED: "bg-zinc-500",
    EXPIRED: "bg-amber-500",
  };
  return map[status] || "bg-zinc-500";
}

export default async function AdminBuyerRequestsPage() {
  await requireAdmin();

  const rows = await db.buyerRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const openCount = rows.filter((r) => r.status === "OPEN" && new Date(r.expiresAt) >= new Date()).length;
  const totalCount = rows.length;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Buyer Requests</h1>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
            <span>{totalCount} total</span>
            <span className="text-emerald-400">{openCount} open</span>
          </p>
        </div>
        <Link
          href="/request-car"
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors shrink-0"
        >
          Public board →
        </Link>
      </div>

      {/* Table */}
      <div className="hidden lg:block">
        <DataTableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  {["Code", "Buyer", "Vehicle", "Budget", "County", "Status", "Expires", ""].map((h) => (
                    <th key={h || "actions"} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <EmptyState
                        title="No buyer requests"
                        icon={<ClipboardList size={28} className="text-zinc-500" />}
                      />
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => {
                    const expired = new Date(row.expiresAt) < new Date();
                    const displayStatus = row.status === "OPEN" && expired ? "EXPIRED" : row.status;
                    const wa = `https://wa.me/${row.phone}?text=${encodeURIComponent(
                      `Hi ${row.name}, Welsh Motorhub here about your car request ${row.publicCode} (${row.yearMin || ""} ${row.make} ${row.model}). We have options for you.`
                    )}`;
                    return (
                      <tr key={row.id} className={`transition-colors hover:bg-zinc-800/30 ${i % 2 === 0 ? "bg-zinc-900/20" : "bg-transparent"}`}>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-zinc-500">{row.publicCode}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-white">{row.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <MessageCircle size={11} />
                              {row.phone}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-white">
                            {row.yearMin || row.yearMax
                              ? `${row.yearMin || "?"}–${row.yearMax || "?"} `
                              : ""}
                            {row.make} {row.model}
                          </p>
                          {(row.bodyType || row.fuelType) && (
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {[row.bodyType, row.fuelType && (FUEL_LABELS[row.fuelType] || row.fuelType)].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-zinc-300 tabular-nums">
                          {row.budgetMin ? formatPrice(row.budgetMin) : "—"} – {formatPrice(row.budgetMax)}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{row.county}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-300">
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDot(displayStatus)}`} />
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                          {new Date(row.expiresAt).toLocaleDateString("en-KE")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <BuyerRequestAdminRowActions
                            requestId={row.id}
                            publicCode={row.publicCode}
                            status={displayStatus}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DataTableShell>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 lg:hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="No buyer requests"
            icon={<ClipboardList size={28} className="text-zinc-500" />}
          />
        ) : null}
        {rows.map((row) => {
          const expired = new Date(row.expiresAt) < new Date();
          const displayStatus = row.status === "OPEN" && expired ? "EXPIRED" : row.status;
          const wa = `https://wa.me/${row.phone}?text=${encodeURIComponent(
            `Hi ${row.name}, Welsh Motorhub here about your car request ${row.publicCode} (${row.yearMin || ""} ${row.make} ${row.model}). We have options for you.`
          )}`;
          return (
            <div key={row.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-zinc-500">{row.publicCode}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-300`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(displayStatus)}`} />
                      {displayStatus}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">{row.name}</p>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <MessageCircle size={11} />
                    {row.phone}
                  </a>
                </div>
                <BuyerRequestAdminRowActions
                  requestId={row.id}
                  publicCode={row.publicCode}
                  status={displayStatus}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                <span className="font-semibold text-white">
                  {row.yearMin || row.yearMax ? `${row.yearMin || "?"}–${row.yearMax || "?"} ` : ""}
                  {row.make} {row.model}
                </span>
                <span className="tabular-nums">{row.budgetMin ? formatPrice(row.budgetMin) : "—"} – {formatPrice(row.budgetMax)}</span>
                <span>{row.county}</span>
                <span>Expires {new Date(row.expiresAt).toLocaleDateString("en-KE")}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer links */}
      <p className="text-[11px] text-zinc-600">
        Public board:{" "}
        <Link href="/requests" className="text-emerald-400 hover:underline font-semibold">/requests</Link>
        {" · "}
        <Link href="/request-car" className="text-emerald-400 hover:underline font-semibold">/request-car</Link>
      </p>
    </div>
  );
}
