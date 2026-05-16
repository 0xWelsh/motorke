// src/app/admin/leads/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  MessageSquare,
  Smartphone,
  Globe,
  Filter,
  Phone,
  Mail,
  Search,
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DataTableShell from "@/components/ui/DataTableShell";
import { carListingPath } from "@/lib/car-listing-url";

export const metadata = { title: "Leads — Welsh Motorhub Admin" };

function adminLeadsHref({ page: pageNum = 1, dealerId = "", search = "" } = {}) {
  const p = new URLSearchParams();
  if (pageNum > 1) p.set("page", String(pageNum));
  if (dealerId) p.set("dealerId", dealerId);
  if (search) p.set("search", search);
  const qs = p.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

export default async function AdminLeadsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const dealerId = sp.dealerId || "";
  const search = (sp.search || "").trim();
  const page = parseInt(sp.page || "1", 10);
  const limit = 25;

  const where = {
    ...(dealerId ? { dealerId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
            { car: { make: { contains: search, mode: "insensitive" } } },
            { car: { model: { contains: search, mode: "insensitive" } } },
            { dealer: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [leads, total, dealers, guestCount] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        car: { select: { id: true, publicSlug: true, make: true, model: true, year: true } },
        dealer: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.lead.count({ where }),
    db.dealer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.lead.count({ where: { ...where, userId: null } }),
  ]);

  const pages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const memberCount = total - guestCount;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      <AdminPageHeader
        eyebrow="Leads"
        title="Customer enquiries"
        description="All leads from forms, WhatsApp, and call intents — guests and signed-in buyers."
        stats={[
          { label: "Total", value: total },
          { label: "Guests", value: guestCount, tone: "text-slate-600 dark:text-zinc-400" },
          { label: "Members", value: memberCount, tone: "text-emerald-700 dark:text-emerald-400" },
        ]}
        actions={
          <ExportButton
            label="Export CSV"
            filename="welsh-motorhub-leads.csv"
            data={leads.map((l) => ({
              ID: l.id,
              Buyer: l.name,
              Phone: l.phone,
              Email: l.email || "N/A",
              Car: `${l.car.year} ${l.car.make} ${l.car.model}`,
              Dealer: l.dealer.name,
              Channel: l.channel,
              Message: l.message || "N/A",
              CreatedAt: l.createdAt,
            }))}
          />
        }
      />

      <form
        method="GET"
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Buyer, phone, email, vehicle, or dealer…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500/45 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <div className="lg:col-span-3">
            <select
              name="dealerId"
              defaultValue={dealerId}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500/45 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">All dealerships</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Filter size={16} /> Apply
            </button>
          </div>
        </div>
        {(search || dealerId) && (
          <p className="mt-3 text-xs text-slate-500">
            Filtered results.{" "}
            <Link href="/admin/leads" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              Clear filters
            </Link>
          </p>
        )}
      </form>

      <DataTableShell>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {total === 0 ? (
              "No leads"
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
                <span className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 opacity-40">
                  Prev
                </span>
              ) : (
                <Link
                  href={adminLeadsHref({ page: page - 1, dealerId, search })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-700 transition hover:border-emerald-500/40 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  Prev
                </Link>
              )}
              <span className="px-2 text-[11px] font-medium tabular-nums text-slate-500">
                Page {page} / {pages}
              </span>
              {page >= pages ? (
                <span className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 opacity-40">
                  Next
                </span>
              ) : (
                <Link
                  href={adminLeadsHref({ page: page + 1, dealerId, search })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-700 transition hover:border-emerald-500/40 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>

        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              {["Buyer", "Vehicle", "Dealership", "Channel", "Date", ""].map((h) => (
                <th key={h || "actions"} className="px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {leads.map((lead) => (
              <tr key={lead.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-900/40">
                <td className="px-5 py-4">
                  <p className="font-semibold capitalize text-slate-900 dark:text-white">{lead.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        lead.userId
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {lead.userId ? "Member" : "Guest"}
                    </span>
                    {lead.phone === "not-provided" ? (
                      <span className="text-[10px] font-medium text-amber-600">No phone</span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {lead.phone !== "not-provided" ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} /> {lead.phone}
                      </span>
                    ) : null}
                    {lead.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} /> {lead.email}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={carListingPath(lead.car)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-900 hover:text-emerald-700 dark:text-white"
                  >
                    {lead.car.year} {lead.car.make} {lead.car.model}
                  </Link>
                </td>
                <td className="px-5 py-4 font-medium text-slate-700 dark:text-zinc-300">{lead.dealer.name}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                      lead.channel === "whatsapp"
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}
                  >
                    {lead.channel === "whatsapp" ? <Smartphone size={14} /> : <Globe size={14} />}
                    {lead.channel}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-zinc-400">
                  <p>{new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
                  <p className="text-xs">
                    {new Date(lead.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </td>
                <td className="px-5 py-4 text-right">
                  {lead.phone && lead.phone !== "not-provided" ? (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(
                        `Hello ${lead.name.split(" ")[0]}, I'm reaching out from ${lead.dealer.name} regarding your inquiry on the ${lead.car.year} ${lead.car.make} ${lead.car.model}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 opacity-100 transition hover:bg-emerald-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                    >
                      <Smartphone size={14} /> WhatsApp
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-900">
              <MessageSquare size={22} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">No leads found</p>
            <p className="mt-1 text-sm text-slate-500">Try clearing filters or check back later.</p>
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
