// src/app/admin/leads/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  MessageSquare, 
  Car, 
  Building2, 
  Smartphone, 
  Globe, 
  ChevronRight,
  Filter,
  ExternalLink,
  Phone,
  Mail,
  Search
} from "lucide-react";

export const metadata = { title: "Lead Stream — Motorke Standard Admin" };

export default async function AdminLeadsPage({ searchParams }) {
  await requireAdmin();
  const sp       = await searchParams;
  const dealerId = sp.dealerId || "";
  const page     = parseInt(sp.page || "1");
  const limit    = 25;

  const where = dealerId ? { dealerId } : {};

  const [leads, total, dealers] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        car:    { select: { id: true, make: true, model: true, year: true } },
        dealer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.lead.count({ where }),
    db.dealer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Yield Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Market Enquiries <span className="text-white/30 font-medium ml-2">({total})</span>
          </h1>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-8 bg-white/5 p-4 rounded-[2rem] border border-white/10">
        <div className="relative flex-1 min-w-[200px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white transition-colors" />
          <input 
            placeholder="Search within stream..." 
            className="w-full bg-surface border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:border-white/30 transition-all placeholder:text-white/30"
          />
        </div>

        <select name="dealerId" defaultValue={dealerId} className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/50 outline-none focus:border-white/30 transition-all cursor-pointer">
          <option value="">All Dealers</option>
          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <button type="submit" className="bg-white/10 border border-white/10 hover:bg-orange-600 hover:border-orange-500 text-pureWhite p-2.5 rounded-xl transition-all shadow-sm">
          <Filter size={16} />
        </button>

        {dealerId && (
          <Link href="/admin/leads" className="text-[10px] font-black uppercase tracking-widest text-black hover:text-white px-2">
            Reset
          </Link>
        )}
      </form>

      {/* ── DATA TABLE ── */}
      <div className="bg-surface border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {["Buyer Profile", "Inquiry Target", "Dealer Hub", "Message Insight", "Yield Date"].map((h) => (
                <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr key={lead.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 border border-white/10 text-white/40 group-hover:bg-white/10 group-hover:text-white flex items-center justify-center font-black text-lg transition-all duration-500 shadow-sm">
                      {lead.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight">{lead.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                         <div className="flex items-center gap-1 text-[10px] font-black text-white/40 uppercase tracking-tighter">
                            <Phone size={10} className="text-white/30" /> {lead.phone}
                         </div>
                         {lead.email && (
                           <div className="flex items-center gap-1 text-[10px] font-black text-white/40 uppercase tracking-tighter">
                              <Mail size={10} className="text-white/30" /> {lead.email}
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <Link href={`/cars/${lead.car.id}`} target="_blank" className="inline-flex items-center gap-2 group/link">
                      <div className="w-8 h-8 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-pureWhite/30 group-hover/link:bg-orange-500/10 group-hover/link:text-black group-hover/link:ring-orange-500/20 transition-all">
                         <Car size={14} />
                      </div>
                      <div>
                         <p className="text-xs font-black text-white uppercase tracking-tight group-hover/link:text-black transition-colors">
                            {lead.car.year} {lead.car.make}
                         </p>
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{lead.car.model}</p>
                      </div>
                   </Link>
                </td>
                <td className="px-8 py-6">
                   <p className="text-xs font-black text-white/60 uppercase tracking-tighter">{lead.dealer.name}</p>
                </td>
                <td className="px-8 py-6">
                   <div className="max-w-xs">
                      <p className="text-[11px] font-medium text-white/50 line-clamp-2 leading-relaxed">
                         {lead.message || <span className="text-white/20 italic font-normal tracking-widest text-[9px] uppercase">No transmission data</span>}
                      </p>
                      <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                        lead.channel === 'whatsapp' ? 'bg-emerald-500/10 text-black border-emerald-500/20' : 'bg-blue-500/10 text-black border-blue-500/20'
                      }`}>
                         {lead.channel === 'whatsapp' ? <Smartphone size={8} /> : <Globe size={8} />}
                         {lead.channel}
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6 text-[11px] font-black text-white/40 uppercase tracking-tighter">
                   {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {leads.length === 0 && (
          <div className="py-20 text-center">
            <MessageSquare size={40} className="mx-auto text-white/5 mb-4" />
            <p className="text-sm font-black text-white/30 uppercase tracking-widest">Inquiry stream is empty</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/admin/leads?page=${p}&dealerId=${dealerId}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                p === page ? "bg-orange-600 text-white shadow-xl" : "bg-surface border border-white/10 text-white/40 hover:border-white/30 hover:text-white"
              }`}
            >
              {p.toString().padStart(2, '0')}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
