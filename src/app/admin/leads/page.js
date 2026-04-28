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

export const metadata = { title: "Leads Dashboard — Welsh Motors Admin" };

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
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-2xl bg-[#ff5a2f] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Leads CRM</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white dark:text-white tracking-tight">
            Customer Leads <span className="text-slate-500 font-medium ml-3">/ {total} Total</span>
          </h1>
        </div>
        
        <ExportButton
          label="Export CSV"
          filename="welsh-motors-leads.csv"
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
      <form method="GET" className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 bg-white dark:bg-slate-900 border border-[#ddd4c8] dark:border-slate-800 p-4 rounded-2xl shadow-none">
        <div className="lg:col-span-7 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#ff5a2f] transition-colors" />
          <input 
            placeholder="Search by buyer name, contact, or vehicle..." 
            className="w-full bg-[#f7f6f3] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-900 dark:text-white dark:text-white outline-none focus:border-[#ff5a2f]/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="lg:col-span-3">
          <select name="dealerId" defaultValue={dealerId} className="w-full bg-[#f7f6f3] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-[#ff5a2f]/50 transition-all cursor-pointer">
            <option value="">All Dealerships</option>
            {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="lg:col-span-2">
           <button type="submit" className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-[#ff5a2f] dark:hover:bg-[#ff5a2f] text-white py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-bold group">
            <Filter size={16} className="group-hover:scale-110 transition-transform" /> Filter
          </button>
        </div>
      </form>

      {/* ── DATA REGISTRY ── */}
      <div className="bg-white dark:bg-slate-900 border border-[#ddd4c8] dark:border-slate-800 rounded-2xl overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#ddd4c8] dark:border-slate-800 bg-[#f7f6f3] dark:bg-slate-900/50">
                {["Buyer", "Vehicle", "Dealership", "Source", "Date", ""].map((h) => (
                  <th key={h} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-[#f7f6f3] dark:hover:bg-slate-800/50 transition-colors relative">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-white capitalize group-hover:text-[#ff5a2f] transition-colors">{lead.name}</p>
                       <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                             <Phone size={12} /> {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                               <Mail size={12} /> {lead.email}
                            </div>
                          )}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <Link href={`/cars/${lead.car.id}`} target="_blank" className="group/link block">
                        <p className="text-sm font-semibold font-sans text-slate-900 dark:text-white dark:text-white group-hover/link:text-[#ff5a2f] transition-colors mb-0.5">
                           {lead.car.year} {lead.car.make}
                        </p>
                        <p className="text-xs font-sans text-slate-500 dark:text-slate-400">{lead.car.model}</p>
                     </Link>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-sm font-semibold text-slate-900 dark:text-white dark:text-white">{lead.dealer.name}</p>
                  </td>
                  <td className="px-6 py-4">
                     <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl text-xs font-semibold ${
                        lead.channel === 'whatsapp' ? 'bg-[#ff5a2f]/10 dark:bg-[#ff5a2f]/10 text-[#ff5a2f] dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                     }`}>
                        {lead.channel === 'whatsapp' ? <Smartphone size={14} /> : <Globe size={14} />}
                        <span className="capitalize">{lead.channel}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <p className="text-sm text-slate-900 dark:text-white dark:text-slate-300">
                          {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                           {new Date(lead.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {lead.phone && (
                      <a 
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(`Hello ${lead.name.split(' ')[0]}, I'm reaching out from ${lead.dealer.name} regarding your inquiry on the ${lead.car.year} ${lead.car.make} ${lead.car.model}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 text-[#ff5a2f] dark:text-emerald-400 hover:bg-[#ff5a2f] hover:text-white dark:hover:bg-[#ff5a2f] dark:hover:text-white rounded-2xl text-xs font-bold transition-all border border-[#ddd4c8] dark:border-slate-700 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Smartphone size={14} /> Message
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {leads.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-[#f7f6f3] dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <MessageSquare size={24} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white dark:text-white">No Leads Found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">There are currently no inquiries in the system.</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/admin/leads?page=${p}&dealerId=${dealerId}`}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                p === page 
                  ? "bg-[#ff5a2f] text-white shadow-[#ff5a2f]/20" 
                  : "bg-white dark:bg-slate-800 border border-[#ddd4c8] dark:border-slate-700 text-white dark:text-white hover:border-[#ff5a2f] hover:text-[#ff5a2f]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
