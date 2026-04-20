// src/app/portal/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, formatCarPrice, formatMileage } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Plus, 
  Car, 
  EyeOff, 
  MessageSquare, 
  ArrowUpRight, 
  CheckCircle2, 
  MoreVertical,
  Edit3,
  ExternalLink,
  Eye,
  ShieldCheck
} from "lucide-react";

export const metadata = { title: "Dashboard — Motorke Dealer Portal" };

export default async function PortalPage({ searchParams }) {
  const user = await requireDealer();
  const sp = await searchParams;
  const created = sp?.created === "1";
  const createdCarId = sp?.car || "";

  if (!user.dealerId || !user.dealer) {
    redirect("/portal/profile?error=missing_dealer");
  }

  const [cars, leads] = await Promise.all([
    db.car.findMany({
      where:   { dealerId: user.dealerId },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.count({ where: { dealerId: user.dealerId } }),
  ]);

  const live   = cars.filter((c) => c.available).length;
  const hidden = cars.filter((c) => !c.available).length;

  return (
    <div className="animate-in fade-in duration-700">
      {user.dealer && !user.dealer.verified && (
        <div className="mb-8 sm:mb-10 p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} className="sm:block hidden" />
              <ShieldCheck size={16} className="sm:hidden" />
            </div>
            <div>
              <h3 className="text-[11px] uppercase font-black tracking-[0.10em] text-amber-800 mb-1">Account Under Review</h3>
              <p className="text-[11px] uppercase font-black tracking-[0.10em] text-amber-700/80 leading-tight">Dealer pending verification. Inventory visible after approval.</p>
            </div>
        </div>
      )}
      
      <div className="flex flex-col gap-6 sm:gap-8 mb-8 sm:mb-12">
        <div>
          <span className="text-[11px] sm:text-[11px] font-bold uppercase tracking-wider text-[#ff5a2f] mb-1 sm:mb-2 block">Dealer Dashboard</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href="/portal/cars/bulk"
            className="flex items-center justify-center sm:justify-start gap-2 border border-[#e8e2d9] dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-[#111111] text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider px-4 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> Bulk Upload
          </Link>
          <Link href="/portal/cars/new"
            className="flex items-center justify-center sm:justify-start gap-2 bg-[#111111] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-sm transition-all">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> New Listing
          </Link>
        </div>
      </div>

      {created && (
        <div className="mb-8 rounded-2xl border border-[#ff5a2f] bg-emerald-50 px-6 py-5">
          <h2 className="text-[11px] uppercase font-black tracking-[0.10em] font-black uppercase tracking-[0.12em] text-[#ff5a2f]">Listing Published</h2>
          <p className="mt-2 text-[11px] uppercase font-black tracking-[0.10em] font-semibold text-emerald-800">
            Great work. Complete these quick actions to boost enquiries.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Link href={createdCarId ? `/cars/${createdCarId}` : "/portal/inventory"} className="rounded-2xl border border-[#ff5a2f] bg-white px-3 py-2 text-[11px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-[#ff5a2f] hover:bg-emerald-100">View Live Listing</Link>
            <Link href="/portal/inventory" className="rounded-2xl border border-[#ff5a2f] bg-white px-3 py-2 text-[11px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-[#ff5a2f] hover:bg-emerald-100">Share To Buyer Groups</Link>
            <Link href="/portal/leads" className="rounded-2xl border border-[#ff5a2f] bg-white px-3 py-2 text-[11px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-[#ff5a2f] hover:bg-emerald-100">Watch Incoming Leads</Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {[
          { label: "Live Inventory", value: live,   icon: <CheckCircle2 className="text-[#ff5a2f]" />, sub: "Publicly visible units" },
          { label: "Drafts / Hidden",   value: hidden, icon: <EyeOff className="text-slate-700 dark:text-slate-400" />, sub: "Private units" },
          { label: "Buyer Leads", value: leads,  icon: <MessageSquare className="text-[#ff5a2f]" />, sub: "Total enquiries" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#111111] border border-[#e8e2d9] dark:border-slate-800 rounded-2xl p-5 sm:p-6 hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all duration-300 group shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-[#1a1a1a] border border-[#e8e2d9] dark:border-slate-700 rounded-xl flex items-center justify-center group-hover:bg-orange-50 dark:group-hover:bg-[#ff5a2f]/10 transition-all">
                {stat.icon}
              </div>
              <ArrowUpRight className="text-slate-300 dark:text-slate-600 group-hover:text-[#ff5a2f] transition-colors" size={20} />
            </div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">{stat.value.toString().padStart(2, '0')}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#111111] border border-[#e8e2d9] dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mb-12">
        <div className="px-6 py-5 border-b border-[#e8e2d9] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111111]/50">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff5a2f]" />
            Recent Vehicles
          </h2>
          <Link href="/portal/inventory" className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-700 hover:text-[#ff5a2f] transition-colors">
            View All →
          </Link>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-16 sm:py-24 px-6 sm:px-8">
            <div className="w-16 h-16 bg-slate-50 dark:bg-[#111111] border border-[#e8e2d9] dark:border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Car className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No cars listed yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 font-medium">
              Your inventory is currently empty. Start reaching thousands of buyers by adding your first vehicle.
            </p>
            <Link href="/portal/cars/new"
              className="inline-flex items-center gap-2 bg-[#ff5a2f] hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm">
              Add Your First Car
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#111111] border-b border-[#e8e2d9] dark:border-slate-800">
                  <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 sm:px-6 py-4">Vehicle Details</th>
                  <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 sm:px-6 py-4 hidden sm:table-cell">Price / Market</th>
                  <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 sm:px-6 py-4">Status</th>
                  <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 sm:px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50 dark:bg-[#111111] dark:hover:bg-[#111111]/50 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-10 sm:w-16 sm:h-12 rounded-xl bg-slate-100 dark:bg-[#111111] overflow-hidden shrink-0 border border-[#e8e2d9] dark:border-slate-800">
                          {car.images[0]
                            ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            : <div className="flex items-center justify-center h-full text-slate-400 text-[10px] font-bold uppercase">No Pic</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{car.year} {car.make} {car.model}</p>
                          <p className="text-xs font-semibold text-slate-500 capitalize truncate">{car.variant || "Standard Trim"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCarPrice(car)}</p>
                      <p className="text-xs font-semibold text-slate-500 capitalize">{formatMileage(car.mileage)} · {car.fuelType}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-widest ${
                        car.available
                          ? "bg-emerald-50 dark:bg-[#ff5a2f]/10 text-[#ff5a2f] dark:text-emerald-400 border border-emerald-100 dark:border-[#ff5a2f]/20"
                          : "bg-[#fbfcfe] dark:bg-[#111111] text-white dark:text-white border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${car.available ? "bg-[#ff5a2f] animate-pulse" : "bg-slate-400"}`} />
                        {car.available ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link href={`/portal/cars/${car.id}/edit`}
                          className="p-2 bg-white dark:bg-[#111111] text-slate-700 dark:text-slate-300 hover:text-[#ff5a2f] dark:hover:text-emerald-400 rounded-xl border border-[#e8e2d9] dark:border-slate-800 hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all shadow-sm">
                          <Edit3 size={14} />
                        </Link>
                        <Link href={`/cars/${car.id}`} target="_blank"
                          className="p-2 bg-white dark:bg-[#111111] text-slate-700 dark:text-slate-300 hover:text-[#ff5a2f] dark:hover:text-emerald-400 rounded-xl border border-[#e8e2d9] dark:border-slate-800 hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all shadow-sm">
                          <ExternalLink size={14} />
                        </Link>
                        <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                          <button type="submit"
                            className="p-2 bg-white dark:bg-[#111111] text-slate-700 dark:text-slate-300 hover:text-[#ff5a2f] dark:hover:text-emerald-400 rounded-xl border border-[#e8e2d9] dark:border-slate-800 hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all shadow-sm">
                            {car.available ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
