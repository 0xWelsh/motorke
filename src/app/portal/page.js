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
        <div className="mb-10 p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-start gap-4 shadow-sm shadow-amber-500/5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-600 tracking-tight mb-1">Account under review</h3>
              <p className="text-[11px] font-black text-slate-500 leading-tight">Your dealership is pending verification by our administrators. You can build out your profile and prepare your inventory, but your dealership will not be publicly visible until approved.</p>
            </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--brand)] mb-2.5 block">Dealer Intelligence</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Marketplace Insights</h1>
        </div>
        <Link href="/portal/cars/new"
          className="flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-accent)] text-white text-[13px] font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-[var(--brand)]/20 hover:scale-105 active:scale-95 uppercase tracking-widest">
          <Plus size={18} /> New Listing
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Live Inventory", value: live,   icon: <CheckCircle2 className="text-emerald-600" />, sub: "Publicly visible units" },
          { label: "Hidden Listings",   value: hidden, icon: <EyeOff className="text-slate-400" />, sub: "Drafts or private units" },
          { label: "Buyer Leads", value: leads,  icon: <MessageSquare className="text-[var(--brand)]" />, sub: "New enquiries today" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-all shadow-sm">
                {stat.icon}
              </div>
              <ArrowUpRight className="text-slate-200 group-hover:text-[var(--brand)] transition-colors" size={24} />
            </div>
            <p className="text-5xl font-black text-slate-900 mb-2.5 tracking-tighter">{stat.value.toString().padStart(2, '0')}</p>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--brand)] mb-1.5">{stat.label}</p>
            <p className="text-[10px] font-bold text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Showroom Activity
          </h2>
          <Link href="/portal/inventory" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[var(--brand)] transition-colors">
            Manage Inventory →
          </Link>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-32 px-10">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Car className="text-slate-200" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No cars listed yet</h3>
            <p className="dark:text-slate-400 text-slate-600 text-sm max-w-xs mx-auto mb-8 font-medium">
              Your inventory is currently empty. Start reaching thousands of buyers by adding your first vehicle.
            </p>
            <Link href="/portal/cars/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/10">
              Add Your First Car
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-8 py-5">Vehicle Details</th>
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 py-5 hidden sm:table-cell">Price / Market</th>
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 py-5">Status</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-8 py-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden ring-1 ring-slate-200 shrink-0">
                          {car.images[0]
                            ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            : <div className="flex items-center justify-center h-full dark:text-slate-300 text-slate-500 italic text-[10px] font-black">NA</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate tracking-tight">{car.year} {car.make} {car.model}</p>
                          <p className="text-[10px] font-bold dark:text-slate-400 text-slate-600 uppercase tracking-tighter truncate">{car.variant || "Standard Edition"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <p className="text-sm font-black text-slate-900">{formatPrice(car.price)}</p>
                      <p className="text-[10px] font-bold dark:text-slate-400 text-slate-600 uppercase tracking-tighter">{formatMileage(car.mileage)} · {car.fuelType}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                        car.available
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${car.available ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {car.available ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/portal/cars/${car.id}/edit`}
                          className="p-2.5 bg-slate-50 text-slate-500 hover:text-[var(--brand)] hover:bg-emerald-50 rounded-xl border border-slate-100 hover:border-emerald-100 transition-all shadow-sm">
                          <Edit3 size={16} />
                        </Link>
                        <Link href={`/cars/${car.id}`} target="_blank"
                          className="p-2.5 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-100 hover:border-emerald-100 transition-all shadow-sm">
                          <ExternalLink size={16} />
                        </Link>
                        <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                          <button type="submit"
                            className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all shadow-sm">
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
