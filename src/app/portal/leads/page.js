// src/app/portal/leads/page.js
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/utils";

export const metadata = { title: "Enquiries — Motorke Portal" };

export default async function PortalLeadsPage() {
  const user = await requireDealer();

  const leads = await db.lead.findMany({
    where:   { dealerId: user.dealerId },
    include: {
      car: { select: { id: true, make: true, model: true, year: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const unread = leads.length; // In a real app track read/unread state

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black">Enquiries</h1>
        <p className="text-white/40 text-sm mt-1">
          {unread} total enquiries from buyers
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-2xl">
          <p className="text-5xl mb-4">📩</p>
          <p className="text-lg font-bold mb-2">No enquiries yet</p>
          <p className="text-white/40 text-sm">
            When buyers contact you through Motorke, their messages appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const carTitle = `${lead.car.year} ${lead.car.make} ${lead.car.model}`;
            const waLink   = lead.phone
              ? `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${lead.name}, thanks for your enquiry about the ${carTitle} on Motorke.`)}`
              : null;

            return (
              <div key={lead.id}
                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">

                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-[#f97316]/20 flex items-center justify-center text-[#f97316] font-black text-lg flex-shrink-0">
                  {lead.name[0].toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold">{lead.name}</p>
                    <span className="text-xs bg-white/5 border border-white/10 text-white/40 rounded-full px-2 py-0.5">
                      {lead.channel}
                    </span>
                  </div>

                  <a href={`/cars/${lead.car.id}`}
                    className="text-sm text-[#f97316] hover:text-orange-400 transition-colors">
                    {carTitle}
                  </a>

                  {lead.message && (
                    <p className="text-sm text-white/60 mt-2 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                      "{lead.message}"
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/40">
                    <span>📞 {lead.phone}</span>
                    {lead.email && <span>✉️ {lead.email}</span>}
                    <span>🕐 {new Date(lead.createdAt).toLocaleString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`}
                      className="text-xs border border-white/10 hover:border-white/20 text-white/50 hover:text-white rounded-lg px-3 py-2 transition-all text-center">
                      📞 Call
                    </a>
                  )}
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg px-3 py-2 transition-all text-center">
                      💬 WhatsApp
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}?subject=Re: ${carTitle} on Motorke`}
                      className="text-xs border border-white/10 hover:border-white/20 text-white/50 hover:text-white rounded-lg px-3 py-2 transition-all text-center">
                      ✉️ Email
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
