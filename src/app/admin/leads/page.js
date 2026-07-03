import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  MessageSquare,
  Smartphone,
  Globe,
  Search,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";
import DataTableShell from "@/components/ui/DataTableShell";
import { LeadStatusBadge, LeadStatusSelect } from "@/components/admin/LeadStatusBadge";
import { carListingPath } from "@/lib/car-listing-url";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads | Welsh Motorhub Admin" };

const VALID_STATUSES = ["", "NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "SOLD", "DEAD"];

function adminLeadsHref({ page: pageNum = 1, search = "", status = "" } = {}) {
  const p = new URLSearchParams();
  if (pageNum > 1) p.set("page", String(pageNum));
  if (search) p.set("search", search);
  if (status) p.set("status", status);
  const qs = p.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

export default async function AdminLeadsPage(props) {
  await requireAdmin();
  const sp = await props.searchParams;
  const search = (sp.search || "").trim();
  const statusFilter = sp.status || "";
  const page = parseInt(sp.page || "1", 10);
  const limit = 25;

  const statusWhere = statusFilter === "ACTIVE"
    ? { status: { in: ["CONTACTED", "INTERESTED", "NEGOTIATING"] } }
    : (statusFilter && VALID_STATUSES.includes(statusFilter) ? { status: statusFilter } : {});

  const where = {
    ...statusWhere,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
            { car: { make: { contains: search, mode: "insensitive" } } },
            { car: { model: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [leads, total, newCount, activeCount, soldCount] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        car: { select: { id: true, publicSlug: true, make: true, model: true, year: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.lead.count({ where }),
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.count({
      where: { status: { in: ["CONTACTED", "INTERESTED", "NEGOTIATING"] } },
    }),
    db.lead.count({ where: { status: "SOLD" } }),
  ]);

  const pages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const filteredTotals = {
    all: total,
    NEW: newCount,
    ACTIVE: activeCount,
    SOLD: soldCount,
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Leads</h1>
          <p className="mt-1 text-[11px] text-zinc-500">Customer enquiries from forms, WhatsApp, and call intents.</p>
        </div>
        <ExportButton
          label="Export CSV"
          filename="welsh-motorhub-leads.csv"
          data={leads.map((l) => ({
            ID: l.id,
            Status: l.status,
            Buyer: l.name,
            Phone: l.phone,
            Email: l.email || "N/A",
            Car: `${l.car.year} ${l.car.make} ${l.car.model}`,
            Channel: l.channel,
            Message: l.message || "N/A",
            CreatedAt: l.createdAt,
          }))}
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { key: "all", label: "All", count: filteredTotals.all, value: "" },
          { key: "NEW", label: "New", count: filteredTotals.NEW, value: "NEW" },
          { key: "ACTIVE", label: "Active", count: filteredTotals.ACTIVE, value: "ACTIVE" },
          { key: "SOLD", label: "Sold", count: filteredTotals.SOLD, value: "SOLD" },
        ].map(({ key, label, count, value }) => (
          <Link
            key={key}
            href={value ? `/admin/leads?status=${value}` : "/admin/leads"}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
              (value === "" && !statusFilter) || statusFilter === value
                ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            {key === "NEW" && <Clock size={12} />}
            {count}
            {" "}{label}
          </Link>
        ))}
      </div>

      {/* Search + filter */}
      <form method="GET" className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Buyer, phone, email, or vehicle…"
              autoComplete="off"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:bg-zinc-950"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="cursor-pointer rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none transition focus:border-emerald-500/50"
          >
            <option value="">All statuses</option>
            {VALID_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            Apply
          </button>
          {(search || statusFilter) && (
            <Link
              href="/admin/leads"
              className="rounded-md border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <DataTableShell>
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {total === 0 ? "No leads" : (
                <>Showing <span className="text-white">{from}–{to}</span> of <span className="text-white">{total}</span></>
              )}
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                {page <= 1 ? (
                  <span className="rounded-md px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-600">Prev</span>
                ) : (
                  <Link href={adminLeadsHref({ page: page - 1, search, status: statusFilter })}
                    className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-400 hover:text-white transition-colors">Prev</Link>
                )}
                <span className="px-2 text-[11px] font-medium tabular-nums text-zinc-500">{page} / {pages}</span>
                {page >= pages ? (
                  <span className="rounded-md px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-600">Next</span>
                ) : (
                  <Link href={adminLeadsHref({ page: page + 1, search, status: statusFilter })}
                    className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-400 hover:text-white transition-colors">Next</Link>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  {["Buyer", "Vehicle", "Channel", "Status", "Date", ""].map((h) => (
                    <th key={h || "actions"} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {leads.map((lead, i) => (
                  <LeadRow key={lead.id} lead={lead} index={i} />
                ))}
              </tbody>
            </table>
          </div>

          {leads.length === 0 && (
            <EmptyState
              title="No leads found"
              message={search || statusFilter ? "Try clearing your filters." : "No enquiries yet."}
              icon={<MessageSquare size={28} className="text-zinc-500" />}
            />
          )}
        </DataTableShell>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 lg:hidden">
        {leads.length === 0 && (
          <EmptyState
            title="No leads found"
            message={search || statusFilter ? "Try clearing your filters." : "No enquiries yet."}
            icon={<MessageSquare size={28} className="text-zinc-500" />}
          />
        )}
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function LeadRow({ lead, index }) {
  return (
    <tr className={`transition-colors hover:bg-zinc-800/30 ${index % 2 === 0 ? "bg-zinc-900/20" : "bg-transparent"}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white">{lead.name}</p>
          {!lead.userId && (
            <span className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">Guest</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
          {lead.phone !== "not-provided" ? (
            <span className="inline-flex items-center gap-1"><Phone size={11} /> {lead.phone}</span>
          ) : <span className="text-amber-600 text-[10px] font-semibold">No phone</span>}
          {lead.email && (
            <span className="inline-flex items-center gap-1"><Mail size={11} /> {lead.email}</span>
          )}
        </div>
        {lead.message && (
          <p className="mt-1 text-[11px] text-zinc-600 italic truncate max-w-[250px]" title={lead.message}>
            &ldquo;{lead.message.slice(0, 60)}&rdquo;
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <Link
          href={carListingPath(lead.car)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors"
        >
          {lead.car.year} {lead.car.make} {lead.car.model}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          lead.channel === "whatsapp"
            ? "bg-emerald-950/40 text-emerald-300"
            : "bg-blue-950/40 text-blue-300"
        }`}>
          {lead.channel === "whatsapp" ? <Smartphone size={11} /> : <Globe size={11} />}
          {lead.channel}
        </span>
      </td>
      <td className="px-4 py-3">
        <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
        <span>{new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
        <br />
        <span className="text-[10px]">{new Date(lead.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {lead.phone && lead.phone !== "not-provided" ? (
          <a
            href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(
              `Hello ${lead.name.split(" ")[0]}, I'm reaching out from Welsh Motorhub regarding your inquiry on the ${lead.car.year} ${lead.car.make} ${lead.car.model}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
          >
            <Smartphone size={12} /> WhatsApp
          </a>
        ) : null}
      </td>
    </tr>
  );
}

function LeadCard({ lead }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
      {/* Buyer + status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">{lead.name}</p>
            {!lead.userId && (
              <span className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">Guest</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
            {lead.phone !== "not-provided" ? (
              <span className="inline-flex items-center gap-1"><Phone size={11} /> {lead.phone}</span>
            ) : <span className="text-amber-600 text-[10px] font-semibold">No phone</span>}
            {lead.email && (
              <span className="inline-flex items-center gap-1"><Mail size={11} /> {lead.email}</span>
            )}
          </div>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>

      {/* Vehicle + channel */}
      <div className="flex items-center gap-2 text-xs">
        <Link
          href={carListingPath(lead.car)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-white hover:text-emerald-400 transition-colors"
        >
          {lead.car.year} {lead.car.make} {lead.car.model}
        </Link>
        <span className="text-zinc-700">·</span>
        <span className={`inline-flex items-center gap-1 ${
          lead.channel === "whatsapp" ? "text-emerald-400" : "text-blue-400"
        }`}>
          {lead.channel === "whatsapp" ? <Smartphone size={11} /> : <Globe size={11} />}
          <span className="text-[10px] font-bold uppercase">{lead.channel}</span>
        </span>
      </div>

      {/* Message */}
      {lead.message && (
        <p className="text-[11px] text-zinc-600 italic truncate" title={lead.message}>
          &ldquo;{lead.message.slice(0, 80)}&rdquo;
        </p>
      )}

      {/* Date + actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
        <span className="text-[11px] text-zinc-500">
          {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}
          {new Date(lead.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="flex items-center gap-1.5">
          <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
          {lead.phone && lead.phone !== "not-provided" ? (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(
                `Hello ${lead.name.split(" ")[0]}, I'm reaching out from Welsh Motorhub regarding your inquiry on the ${lead.car.year} ${lead.car.make} ${lead.car.model}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors inline-flex"
              title="WhatsApp"
            >
              <Smartphone size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
