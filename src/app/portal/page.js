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
        <div className="mb-8 sm:mb-10 p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-2xl sm:rounded-2xl flex items-start gap-3 sm:gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl sm:rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} className="sm:block hidden" />
              <ShieldCheck size={16} className="sm:hidden" />
            </div>
            <div>
              <h3 className="text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] font-bold text-amber-800 tracking-tight mb-1">Account Under Review</h3>
              <p className="text-[11px] uppercase font-black tracking-[0.15em] font-medium text-amber-700/80 leading-tight">Dealer pending verification. Inventory visible after approval.</p>
            </div>
        </div>
      )}
      
      <div className="flex flex-col gap-6 sm:gap-8 mb-8 sm:mb-12">
        <div>
          <span className="text-[11px] sm:text-[11px] font-bold uppercase tracking-wider text-[#ff5a2f] mb-1 sm:mb-2 block">Dealer Dashboard</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight\">Overview</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href="/portal/cars/bulk"
            className="flex items-center justify-center sm:justify-start gap-2 border border-[#ddd4c8] dark:border-slate-800 bg-white hover:bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] font-bold px-4 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-2xl transition-all tracking-wide">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> Bulk Upload
          </Link>
          <Link href="/portal/cars/new"
            className="flex items-center justify-center sm:justify-start gap-2 bg-[#111111] hover:bg-[#111111] text-white text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-2xl transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all transition-all tracking-wide">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Live Inventory", value: live,   icon: <CheckCircle2 className="text-[#ff5a2f]" />, sub: "Publicly visible units" },
          { label: "Drafts / Hidden",   value: hidden, icon: <EyeOff className="text-slate-700 dark:text-slate-700" />, sub: "Private units" },
          { label: "Buyer Leads", value: leads,  icon: <MessageSquare className="text-[#ff5a2f]" />, sub: "New enquiries today" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-[#ff5a2f]/10 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                {stat.icon}
              </div>
              <ArrowUpRight className="text-slate-300 dark:text-slate-700 group-hover:text-[#ff5a2f] transition-colors" size={20} />
            </div>
            <p className="text-4xl font-black text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-2 tracking-tighter">{stat.value.toString().padStart(2, '0')}</p>
            <p className="text-[11px] uppercase font-black tracking-[0.15em] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-700 mb-1">{stat.label}</p>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-700">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden mb-12">
        <div className="px-8 py-6 border-b border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 flex items-center justify-between bg-[#fbfcfe] dark:bg-[#111111]/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-2xl bg-[#ff5a2f]" />
            Recent Vehicles
          </h2>
          <Link href="/portal/inventory" className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-700 hover:text-[#ff5a2f] transition-colors">
            View All →
          </Link>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-24 px-8">
            <div className="w-16 h-16 bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
              <Car className="text-slate-700" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-2">No cars listed yet</h3>
            <p className="text-slate-700 dark:text-slate-700 text-[11px] uppercase font-black tracking-[0.10em] max-w-sm mx-auto mb-8 font-semibold">
              Your inventory is currently empty. Start reaching thousands of buyers by adding your first vehicle.
            </p>
            <Link href="/portal/cars/new"
              className="inline-flex items-center gap-2 bg-[#ff5a2f] hover:bg-emerald-700 text-slate-900 dark:text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
              Add Your First Car
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#fbfcfe] dark:bg-[#111111] border-b border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800">
                  <th className="text-[11px] font-bold text-slate-700 dark:text-slate-700 uppercase tracking-wider px-6 py-4">Vehicle Details</th>
                  <th className="text-[11px] font-bold text-slate-700 dark:text-slate-700 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Price / Market</th>
                  <th className="text-[11px] font-bold text-slate-700 dark:text-slate-700 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-700 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-[#fbfcfe] dark:bg-[#111111] dark:hover:bg-[#111111]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] overflow-hidden shrink-0 border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800">
                          {car.images[0]
                            ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            : <div className="flex items-center justify-center h-full text-slate-700 dark:text-slate-700 text-[11px] font-bold uppercase">No Pic</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white truncate">{car.year} {car.make} {car.model}</p>
                          <p className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700 dark:text-slate-700 capitalize truncate">{car.variant || "Standard Trim"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">{formatCarPrice(car)}</p>
                      <p className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700 dark:text-slate-700 capitalize">{formatMileage(car.mileage)} · {car.fuelType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-2xl uppercase tracking-wider ${
                        car.available
                          ? "bg-emerald-50 dark:bg-[#ff5a2f]/10 text-[#ff5a2f] dark:text-emerald-400 border border-emerald-100 dark:border-[#ff5a2f]/20"
                          : "bg-[#fbfcfe] dark:bg-[#111111] text-white dark:text-white border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-2xl ${car.available ? "bg-[#ff5a2f] animate-pulse" : "bg-slate-400"}`} />
                        {car.available ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/portal/cars/${car.id}/edit`}
                          className="p-2 bg-white dark:bg-[#111111] text-white dark:text-white hover:text-[#ff5a2f] dark:hover:text-emerald-400 rounded-2xl border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                          <Edit3 size={16} />
                        </Link>
                        <Link href={`/cars/${car.id}`} target="_blank"
                          className="p-2 bg-white dark:bg-[#111111] text-white dark:text-white hover:text-[#ff5a2f] dark:hover:text-emerald-400 rounded-2xl border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                          <ExternalLink size={16} />
                        </Link>
                        <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                          <button type="submit"
                            className="p-2 bg-white dark:bg-[#111111] text-white dark:text-white hover:text-[#ff5a2f] dark:hover:text-emerald-400 rounded-2xl border border-[#ddd4c8] dark:border-[#ddd4c8] dark:border-slate-800 hover:border-[#ff5a2f] dark:hover:border-[#ff5a2f]/50 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                            {car.available ? <EyeOff size={16} /> : <Eye size={16} />}
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
