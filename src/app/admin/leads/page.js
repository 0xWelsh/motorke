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
  Search,
  Zap,
  Clock,
  ArrowUpRight
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";

export const metadata = { title: "Yield Stream — Motorske Control" };

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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
        <div>
           <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500/60">Yield Pipeline Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Market Enquiries <span className="text-white/20 font-medium ml-3">/ {total} Signals</span>
          </h1>
        </div>
        
        <ExportButton 
          filename="motorske-leads.csv"
          data={leads.map(l => ({
            ID: l.id,
            Buyer: l.name,
            Phone: l.phone,
            Email: l.email || "N/A",
            Car: `${l.car.year} ${l.car.make} ${l.car.model}`,
            Dealer: l.dealer.name,
            Channel: l.channel,
            Message: l.message || "N/A",
            CreatedAt: l.createdAt
          }))}
        />
      </div>

      {/* ── ADVANCED FILTERS ── */}
      <form method="GET" className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10 bg-[#0a0c10] border border-white/5 p-4 rounded-3xl shadow-xl">
        <div className="lg:col-span-7 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            placeholder="Filter by Buyer, Contact, or Message Snippet..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-white outline-none focus:border-emerald-500/30 focus:bg-white/[0.05] transition-all placeholder:text-white/20"
          />
        </div>

        <div className="lg:col-span-3">
          <select name="dealerId" defaultValue={dealerId} className="w-full bg-black border border-white/5 rounded-2xl px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white/40 outline-none focus:border-emerald-500/30 transition-all cursor-pointer hover:bg-white/5">
            <option value="">All Partners</option>
            {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="lg:col-span-2">
           <button type="submit" className="w-full bg-white/10 hover:bg-emerald-600 text-white py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-widest">
            <Filter size={16} /> Filter
          </button>
        </div>
      </form>

      {/* ── DATA REGISTRY ── */}
      <div className="bg-[#0a0c10] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {["Buyer Profile", "Inquiry Target", "Dealer Hub", "Signal Channel", "Timestamp"].map((h) => (
                  <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-white/20">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors relative">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 text-white/20 group-hover:bg-emerald-600/10 group-hover:text-emerald-500 flex items-center justify-center font-black text-xl transition-all duration-500 shadow-sm overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10">{lead.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-base font-black text-white tracking-tight leading-none mb-1.5 group-hover:text-emerald-400 transition-colors">{lead.name}</p>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                              <Phone size={12} className="text-emerald-500/40" /> {lead.phone}
                           </div>
                           {lead.email && (
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                <Mail size={12} className="text-emerald-500/40" /> {lead.email}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                     <Link href={`/cars/${lead.car.id}`} target="_blank" className="group/link block">
                        <p className="text-xs font-bold text-white uppercase tracking-widest group-hover/link:text-emerald-500 transition-colors leading-none mb-1">
                           {lead.car.year} {lead.car.make}
                        </p>
                        <p className="text-[10px] font-medium text-white/20 uppercase tracking-tighter">{lead.car.model}</p>
                     </Link>
                  </td>
                  <td className="px-10 py-7">
                     <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">{lead.dealer.name}</p>
                     <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                        <p className="text-[9px] font-medium text-white/10 uppercase tracking-tighter">Authorized Partner</p>
                     </div>
                  </td>
                  <td className="px-10 py-7">
                     <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        lead.channel === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                     }`}>
                        {lead.channel === 'whatsapp' ? <Smartphone size={12} /> : <Globe size={12} />}
                        {lead.channel}
                     </div>
                  </td>
                  <td className="px-10 py-7">
                     <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1.5 text-white/20">
                           <Clock size={12} />
                           <p className="text-[11px] font-bold text-white/40 uppercase tracking-tighter">
                             {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                           </p>
                        </div>
                        <p className="text-[9px] font-medium text-white/10 uppercase tracking-widest ml-4">
                           {new Date(lead.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {leads.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-white/[0.02] rounded-full border border-white/5 flex items-center justify-center mx-auto mb-8">
               <Zap size={32} className="text-emerald-500/20" />
            </div>
            <p className="text-lg font-black text-white/20 uppercase tracking-[0.3em]">No Signals Captured</p>
            <p className="text-sm font-medium text-white/10 mt-2">Yield pipeline is currently clear.</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-16">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/admin/leads?page=${p}&dealerId=${dealerId}`}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black tracking-widest transition-all ${
                p === page 
                  ? "bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-110" 
                  : "bg-[#0a0c10] border border-white/5 text-white/20 hover:border-white/30 hover:text-white"
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
