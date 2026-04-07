// src/app/portal/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, formatMileage } from "@/lib/utils";
import Link from "next/link";
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

export default async function PortalPage() {
  const user = await requireDealer();

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
        <div className="mb-10 p-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 tracking-tight mb-1">Account Under Review</h3>
              <p className="text-xs font-semibold text-amber-700/80 dark:text-amber-500/80 leading-tight">Your dealership is pending verification. You can prepare your inventory, but it will not be publicly visible until approved.</p>
            </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-2 block">Dealer Dashboard</span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
        </div>
        <Link href="/portal/cars/new"
          className="flex items-center gap-2 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 tracking-wide">
          <Plus size={18} /> New Listing
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Live Inventory", value: live,   icon: <CheckCircle2 className="text-emerald-500" />, sub: "Publicly visible units" },
          { label: "Drafts / Hidden",   value: hidden, icon: <EyeOff className="text-slate-400 dark:text-slate-500" />, sub: "Private units" },
          { label: "Buyer Leads", value: leads,  icon: <MessageSquare className="text-emerald-500" />, sub: "New enquiries today" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-emerald-500 dark:hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all shadow-sm">
                {stat.icon}
              </div>
              <ArrowUpRight className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" size={20} />
            </div>
            <p className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">{stat.value.toString().padStart(2, '0')}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mb-12">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Recent Vehicles
          </h2>
          <Link href="/portal/inventory" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">
            View All →
          </Link>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-24 px-8">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Car className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No cars listed yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-8 font-semibold">
              Your inventory is currently empty. Start reaching thousands of buyers by adding your first vehicle.
            </p>
            <Link href="/portal/cars/new"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">
              Add Your First Car
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <th className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-4">Vehicle Details</th>
                  <th className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Price / Market</th>
                  <th className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          {car.images[0]
                            ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            : <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">No Pic</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{car.year} {car.make} {car.model}</p>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">{car.variant || "Standard Trim"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(car.price)}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{formatMileage(car.mileage)} · {car.fuelType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        car.available
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${car.available ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {car.available ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/portal/cars/${car.id}/edit`}
                          className="p-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all shadow-sm">
                          <Edit3 size={16} />
                        </Link>
                        <Link href={`/cars/${car.id}`} target="_blank"
                          className="p-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all shadow-sm">
                          <ExternalLink size={16} />
                        </Link>
                        <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                          <button type="submit"
                            className="p-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all shadow-sm">
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
