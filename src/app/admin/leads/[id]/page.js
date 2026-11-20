import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Smartphone,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Car,
  UserCheck,
  Clock,
  Calendar,
} from "lucide-react";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { carListingPath } from "@/lib/car-listing-url";
import DeleteLeadButton from "@/components/admin/DeleteLeadButton";
import LeadNotesClient from "./LeadNotesClient";
import LeadReassign from "./LeadReassign";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead Detail | BIDGARI Admin" };

function initials(name) {
  return String(name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function LeadDetailPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      car: {
        select: { id: true, publicSlug: true, make: true, model: true, year: true, price: true, variant: true },
      },
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      notes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) notFound();

  const adminTeam = await db.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const channelIsWhatsApp = lead.channel === "whatsapp";
  const channelIsCall = lead.channel === "call";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-emerald-600"
      >
        <ArrowLeft size={14} />
        Back to leads
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — Lead info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Lead card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/25 text-lg font-bold text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
                  {initials(lead.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="truncate text-xl font-bold tracking-tight text-slate-900">{lead.name}</h2>
                    {!lead.userId && (
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400">Guest</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                    {lead.phone !== "not-provided" ? (
                      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-emerald-600">
                        <Phone size={14} />
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                        <Phone size={14} /> No phone provided
                      </span>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-emerald-600">
                        <Mail size={14} />
                        {lead.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>

            {/* Meta chips */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                channelIsWhatsApp
                  ? "border-emerald-500/25 bg-emerald-50 text-emerald-700"
                  : channelIsCall
                    ? "border-sky-500/25 bg-sky-50 text-sky-300"
                    : "border-blue-500/25 bg-blue-500/10 text-blue-300"
              }`}>
                {channelIsWhatsApp ? <Smartphone size={11} /> : channelIsCall ? <Phone size={11} /> : <Globe size={11} />}
                {lead.channel}
              </span>
              {lead.assignedTo && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  <UserCheck size={11} />
                  {lead.assignedTo.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Calendar size={11} />
                {new Date(lead.createdAt).toLocaleDateString("en-KE", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>

            {/* Message */}
            {lead.message && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-[var(--bg)]/50 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <MessageSquare size={11} /> Message
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Notes Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500">
                <Clock size={14} />
              </span>
              Activity Timeline
            </h3>
            <LeadNotesClient
              leadId={lead.id}
              initialNotes={lead.notes}
              currentStatus={lead.status}
            />
          </div>
        </div>

        {/* Right — Car info + actions */}
        <div className="space-y-4">
          {/* Car card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500">
                <Car size={14} />
              </span>
              Vehicle
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Car size={24} />
              </div>
              <div className="min-w-0">
                <Link
                  href={carListingPath(lead.car)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600"
                >
                  {lead.car.year} {lead.car.make} {lead.car.model}
                </Link>
                {lead.car.variant && (
                  <p className="truncate text-[11px] text-slate-400">{lead.car.variant}</p>
                )}
              </div>
            </div>
            {lead.car.price > 0 && (
              <p className="mt-3 text-lg font-bold tracking-tight text-emerald-600 tabular-nums">
                KES {Number(lead.car.price).toLocaleString("en-KE")}
              </p>
            )}
            <Link
              href={carListingPath(lead.car)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 transition-colors hover:text-emerald-700"
            >
              <MessageSquare size={12} />
              View listing
            </Link>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500">
                <UserCheck size={14} />
              </span>
              Actions
            </p>
            <div className="space-y-2.5">
              <LeadReassign
                leadId={lead.id}
                currentAssignedTo={lead.assignedTo}
                adminTeam={adminTeam}
              />
              {lead.phone && lead.phone !== "not-provided" ? (
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(
                    `Hello ${lead.name.split(" ")[0]}, I'm reaching out from BIDGARI regarding your inquiry on the ${lead.car.year} ${lead.car.make} ${lead.car.model}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
                >
                  <Smartphone size={16} />
                  WhatsApp
                </a>
              ) : null}
              <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
