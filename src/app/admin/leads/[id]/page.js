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
} from "lucide-react";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { carListingPath } from "@/lib/car-listing-url";
import DeleteLeadButton from "@/components/admin/DeleteLeadButton";
import LeadNotesClient from "./LeadNotesClient";
import LeadReassign from "./LeadReassign";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead Detail | BIDGARI Admin" };

const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  NEGOTIATING: "Negotiating",
  SOLD: "Sold",
  DEAD: "Dead",
};

function StatusTimelineDot({ status, isLatest }) {
  const colors = {
    NEW: "bg-emerald-500",
    CONTACTED: "bg-blue-500",
    INTERESTED: "bg-violet-500",
    NEGOTIATING: "bg-amber-500",
    SOLD: "bg-green-500",
    DEAD: "bg-zinc-500",
  };
  return (
    <div className="flex flex-col items-center">
      <div className={`h-2.5 w-2.5 rounded-full ${colors[status] || "bg-zinc-500"} ${isLatest ? "ring-2 ring-offset-2 ring-offset-zinc-950 ring-emerald-500/50" : ""}`} />
    </div>
  );
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

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft size={14} />
        Back to leads
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — Lead info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">{lead.name}</h2>
                  {!lead.userId && (
                    <span className="rounded-md border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-500">Guest</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-400">
                  {lead.phone !== "not-provided" ? (
                    <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                      <Phone size={14} />
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                      <Phone size={14} /> No phone provided
                    </span>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                      <Mail size={14} />
                      {lead.email}
                    </a>
                  )}
                </div>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>

            {/* Channel + Date */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-500">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                lead.channel === "whatsapp"
                  ? "bg-emerald-950/40 text-emerald-300"
                  : "bg-blue-950/40 text-blue-300"
              }`}>
                {lead.channel === "whatsapp" ? <Smartphone size={11} /> : <Globe size={11} />}
                {lead.channel}
              </span>
              <span>
                {new Date(lead.createdAt).toLocaleDateString("en-KE", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>

            {/* Message */}
            {lead.message && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Message</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Notes Timeline */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Activity Timeline</h3>
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
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Vehicle</p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
                <Car size={22} />
              </div>
              <div className="min-w-0">
                <Link
                  href={carListingPath(lead.car)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate block"
                >
                  {lead.car.year} {lead.car.make} {lead.car.model}
                </Link>
                {lead.car.variant && (
                  <p className="text-[11px] text-zinc-500 truncate">{lead.car.variant}</p>
                )}
              </div>
            </div>
            {lead.car.price > 0 && (
              <p className="text-sm font-bold text-emerald-400 tabular-nums">
                KSh {Number(lead.car.price).toLocaleString("en-KE")}
              </p>
            )}
            <Link
              href={carListingPath(lead.car)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageSquare size={12} />
              View listing
            </Link>
          </div>

          {/* Actions */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Actions</p>
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
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
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
  );
}
