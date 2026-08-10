import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  MessageSquare,
  Smartphone,
  Globe,
  Phone,
  Search,
  Clock,
  Mail,
  UserCheck,
  Inbox,
  Flame,
  BadgeCheck,
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";
import DataTableShell from "@/components/ui/DataTableShell";
import { LeadStatusBadge, LeadStatusSelect } from "@/components/admin/LeadStatusBadge";
import DeleteLeadButton from "@/components/admin/DeleteLeadButton";
import { carListingPath } from "@/lib/car-listing-url";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads | BIDGARI Admin" };

const VALID_STATUSES = ["", "NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "SOLD", "DEAD"];

function initials(name) {
  return String(name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function adminLeadsHref({ page: pageNum = 1, search = "", status = "", mine = "" } = {}) {
  const p = new URLSearchParams();
  if (pageNum > 1) p.set("page", String(pageNum));
  if (search) p.set("search", search);
  if (status) p.set("status", status);
  if (mine) p.set("mine", mine);
  const qs = p.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

function ChannelBadge({ channel }) {
  const isWhatsApp = channel === "whatsapp";
  const isCall = channel === "call";
  const Icon = isWhatsApp ? Smartphone : isCall ? Phone : Globe;
  const cls = isWhatsApp
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
    : isCall
      ? "border-sky-500/25 bg-sky-500/10 text-sky-300"
      : "border-blue-500/25 bg-blue-500/10 text-blue-300";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      <Icon size={11} />
      {channel}
    </span>
  );
}

export default async function AdminLeadsPage(props) {
  const admin = await requireAdmin();
  const sp = await props.searchParams;
  const search = (sp.search || "").trim();
  const statusFilter = sp.status || "";
  const mineOnly = sp.mine === "1";
  const page = parseInt(sp.page || "1", 10);
  const limit = 25;

  const statusWhere = statusFilter === "ACTIVE"
    ? { status: { in: ["CONTACTED", "INTERESTED", "NEGOTIATING"] } }
    : (statusFilter && VALID_STATUSES.includes(statusFilter) ? { status: statusFilter } : {});

  const where = {
    ...statusWhere,
    ...(mineOnly ? { assignedToId: admin.id } : {}),
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

  const [leads, total, newCount, activeCount, soldCount, myNewCount] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        car: { select: { id: true, publicSlug: true, make: true, model: true, year: true } },
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
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
    db.lead.count({ where: { assignedToId: admin.id, status: "NEW" } }),
  ]);

  const pages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pills = [
    { key: "all", label: "All", count: total, value: "", href: "/admin/leads", Icon: Inbox },
    { key: "mine", label: "My Leads", count: myNewCount, value: "", href: "/admin/leads?mine=1", Icon: UserCheck, mine: true },
    { key: "NEW", label: "New", count: newCount, value: "NEW", href: "/admin/leads?status=NEW", Icon: Clock },
    { key: "ACTIVE", label: "Active", count: activeCount, value: "ACTIVE", href: "/admin/leads?status=ACTIVE", Icon: Flame },
    { key: "SOLD", label: "Sold", count: soldCount, value: "SOLD", href: "/admin/leads?status=SOLD", Icon: BadgeCheck },
  ];

  const isPillActive = (pill) => {
    if (pill.mine) return mineOnly;
    if (pill.value === "") return !statusFilter && !mineOnly;
    return statusFilter === pill.value;
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Leads</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Customer enquiries from forms, WhatsApp, and call intents.</p>
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
      <div className="flex flex-wrap items-center gap-2">
        {pills.map((pill) => {
          const active = isPillActive(pill);
          const Icon = pill.Icon;
          return (
            <Link
              key={pill.key}
              href={pill.href}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
                active
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              <Icon size={13} className={active ? "text-emerald-400" : "text-zinc-500"} />
              {pill.label}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                active ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-400"
              }`}>
                {pill.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search + filter */}
      <form method="GET" className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Buyer, phone, email, or vehicle…"
              autoComplete="off"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-xs font-semibold text-zinc-300 outline-none transition focus:border-emerald-500/50"
          >
            <option value="">All statuses</option>
            {VALID_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500"
          >
            Apply
          </button>
          {(search || statusFilter) && (
            <Link
              href="/admin/leads"
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-400 transition-colors hover:text-white"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <DataTableShell>
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
            <p className="text-xs font-medium text-zinc-500">
              {total === 0 ? "No leads" : (
                <>Showing <span className="font-bold text-white">{from}–{to}</span> of <span className="font-bold text-white">{total}</span></>
              )}
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                {page <= 1 ? (
                  <span className="rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-600">Prev</span>
                ) : (
                  <Link href={adminLeadsHref({ page: page - 1, search, status: statusFilter })}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-400 transition-colors hover:text-white">Prev</Link>
                )}
                <span className="px-2 text-xs font-medium tabular-nums text-zinc-500">{page} / {pages}</span>
                {page >= pages ? (
                  <span className="rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-600">Next</span>
                ) : (
                  <Link href={adminLeadsHref({ page: page + 1, search, status: statusFilter })}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-[11px] font-bold uppercase text-zinc-400 transition-colors hover:text-white">Next</Link>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  {["Buyer", "Vehicle", "Assigned", "Channel", "Status", "Date", ""].map((h) => (
                    <th key={h || "actions"} className="whitespace-nowrap px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
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
      <div className="space-y-2.5 lg:hidden">
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
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/25 to-emerald-700/25 text-[11px] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
            {initials(lead.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/leads/${lead.id}`}
                className="truncate text-sm font-bold text-white transition-colors hover:text-emerald-400"
              >
                {lead.name}
              </Link>
              {!lead.userId && (
                <span className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">Guest</span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
              {lead.phone !== "not-provided" ? (
                <span className="inline-flex items-center gap-1"><Phone size={11} /> {lead.phone}</span>
              ) : <span className="text-[10px] font-semibold text-amber-500">No phone</span>}
              {lead.email && (
                <span className="inline-flex items-center gap-1 truncate"><Mail size={11} /> {lead.email}</span>
              )}
            </div>
            {lead.message && (
              <p className="mt-1 max-w-[280px] truncate text-[11px] italic text-zinc-600" title={lead.message}>
                &ldquo;{lead.message.slice(0, 60)}&rdquo;
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <Link
          href={carListingPath(lead.car)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-white transition-colors hover:text-emerald-400"
        >
          {lead.car.year} {lead.car.make} {lead.car.model}
        </Link>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs text-zinc-400">
          {lead.assignedTo ? (
            <span className="inline-flex items-center gap-1.5">
              <UserCheck size={12} className="text-emerald-500" />
              {lead.assignedTo.name}
            </span>
          ) : (
            <span className="text-zinc-600">—</span>
          )}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <ChannelBadge channel={lead.channel} />
      </td>
      <td className="px-5 py-3.5">
        <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
      </td>
      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-500">
        <span>{new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
        <br />
        <span className="text-[10px]">{new Date(lead.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {lead.phone && lead.phone !== "not-provided" ? (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(
                `Hello ${lead.name.split(" ")[0]}, I'm reaching out from BIDGARI regarding your inquiry on the ${lead.car.year} ${lead.car.make} ${lead.car.model}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400 transition-colors hover:bg-emerald-600 hover:text-white"
            >
              <Smartphone size={12} /> WhatsApp
            </a>
          ) : null}
          <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
        </div>
      </td>
    </tr>
  );
}

function LeadCard({ lead }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/25 to-emerald-700/25 text-xs font-bold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
            {initials(lead.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-white">{lead.name}</p>
              {!lead.userId && (
                <span className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">Guest</span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
              {lead.phone !== "not-provided" ? (
                <span className="inline-flex items-center gap-1"><Phone size={11} /> {lead.phone}</span>
              ) : <span className="text-[10px] font-semibold text-amber-500">No phone</span>}
              {lead.email && (
                <span className="inline-flex items-center gap-1 truncate"><Mail size={11} /> {lead.email}</span>
              )}
            </div>
          </div>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <Link
          href={carListingPath(lead.car)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-white transition-colors hover:text-emerald-400"
        >
          {lead.car.year} {lead.car.make} {lead.car.model}
        </Link>
        <ChannelBadge channel={lead.channel} />
        {lead.assignedTo && (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <UserCheck size={11} />
            <span className="text-[10px] font-bold">{lead.assignedTo.name}</span>
          </span>
        )}
      </div>

      {lead.message && (
        <p className="mt-2 truncate text-[11px] italic text-zinc-600" title={lead.message}>
          &ldquo;{lead.message.slice(0, 80)}&rdquo;
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800 pt-3">
        <span className="text-[11px] text-zinc-500">
          {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}
          {new Date(lead.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="flex items-center gap-1.5">
          <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
          <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
          {lead.phone && lead.phone !== "not-provided" ? (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(
                `Hello ${lead.name.split(" ")[0]}, I'm reaching out from BIDGARI regarding your inquiry on the ${lead.car.year} ${lead.car.make} ${lead.car.model}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-1.5 text-emerald-400 transition-colors hover:bg-emerald-600 hover:text-white"
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
