export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BuyerRequestAdminRowActions from "@/components/admin/BuyerRequestAdminRowActions";
import DataTableShell from "@/components/ui/DataTableShell";
import { FUEL_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Buyer Requests | Welsh Motorhub Admin" };

function statusBadge(status) {
  const map = {
    OPEN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    MATCHED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    CLOSED: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400",
    EXPIRED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  };
  return map[status] || map.CLOSED;
}

export default async function AdminBuyerRequestsPage() {
  await requireAdmin();

  const rows = await db.buyerRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Buyer requests"
        description="Car wanted posts from buyers. Contact buyers on WhatsApp to coordinate seller offers."
      />

      <DataTableShell>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-3 pr-4">Code</th>
                <th className="py-3 pr-4">Buyer</th>
                <th className="py-3 pr-4">Vehicle</th>
                <th className="py-3 pr-4">Budget</th>
                <th className="py-3 pr-4">County</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Offers</th>
                <th className="py-3 pr-4">Expires</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No buyer requests yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const expired = new Date(row.expiresAt) < new Date();
                  const displayStatus =
                    row.status === "OPEN" && expired ? "EXPIRED" : row.status;
                  const wa = `https://wa.me/${row.phone}?text=${encodeURIComponent(
                    `Hi ${row.name}, Welsh Motorhub here about your car request ${row.publicCode} (${row.yearMin || ""} ${row.make} ${row.model}). We have a seller offer for you: `
                  )}`;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 dark:border-zinc-900 align-top"
                    >
                      <td className="py-3 pr-4 font-mono text-xs font-bold">{row.publicCode}</td>
                      <td className="py-3 pr-4 min-w-[140px]">
                        <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#38A169] font-bold hover:underline"
                        >
                          {row.phone}
                        </a>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">
                          {row.yearMin || row.yearMax
                            ? `${row.yearMin || "?"}–${row.yearMax || "?"} `
                            : ""}
                          {row.make} {row.model}
                        </p>
                        {row.variant ? (
                          <p className="text-xs text-slate-500">{row.variant}</p>
                        ) : null}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {[row.bodyType, row.fuelType && (FUEL_LABELS[row.fuelType] || row.fuelType)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {row.budgetMin ? formatPrice(row.budgetMin) : "—"} – {formatPrice(row.budgetMax)}
                      </td>
                      <td className="py-3 pr-4">{row.county}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusBadge(displayStatus)}`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{row.offerClicks}</td>
                      <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(row.expiresAt).toLocaleDateString("en-KE")}
                      </td>
                      <td className="py-3 text-right">
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

      <p className="text-xs text-slate-500">
        Public board:{" "}
        <Link href="/requests" className="text-[#38A169] hover:underline">
          /requests
        </Link>
        {" · "}
        <Link href="/request-car" className="text-[#38A169] hover:underline">
          /request-car
        </Link>
      </p>
    </div>
  );
}
