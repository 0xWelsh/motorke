// src/app/admin/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard — Motorke" };

export default async function AdminDashboard() {
  await requireAdmin();

  const [
    totalCars,
    totalDealers,
    totalLeads,
    totalUsers,
    recentLeads,
    recentCars,
    pendingCars,
  ] = await Promise.all([
    db.car.count({ where: { available: true } }),
    db.dealer.count(),
    db.lead.count(),
    db.user.count(),
    db.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        car:    { select: { make: true, model: true, year: true } },
        dealer: { select: { name: true } },
      },
    }),
    db.car.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { dealer: { select: { name: true } } },
    }),
    db.car.count({ where: { available: false } }),
  ]);

  const stats = [
    { label: "Live listings",  value: totalCars,    color: "text-[#f97316]" },
    { label: "Dealerships",    value: totalDealers, color: "text-blue-400"  },
    { label: "Enquiries",      value: totalLeads,   color: "text-green-400" },
    { label: "Portal users",   value: totalUsers,   color: "text-purple-400"},
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-black mb-8">Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent enquiries */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black">Recent enquiries</h2>
            <a href="/admin/leads" className="text-xs text-[#f97316] hover:text-orange-400">View all →</a>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-white/30 text-sm">No enquiries yet</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-semibold">{lead.name}</p>
                    <p className="text-xs text-white/40">
                      {lead.car.year} {lead.car.make} {lead.car.model} · {lead.dealer.name}
                    </p>
                  </div>
                  <p className="text-xs text-white/30">
                    {new Date(lead.createdAt).toLocaleDateString("en-KE")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently added cars */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black">Recently added</h2>
            <a href="/admin/cars" className="text-xs text-[#f97316] hover:text-orange-400">View all →</a>
          </div>
          {recentCars.length === 0 ? (
            <p className="text-white/30 text-sm">No cars yet</p>
          ) : (
            <div className="space-y-3">
              {recentCars.map((car) => (
                <div key={car.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-semibold">{car.year} {car.make} {car.model}</p>
                    <p className="text-xs text-white/40">{car.dealer.name}</p>
                  </div>
                  <p className="text-sm font-bold text-[#f97316]">{formatPrice(car.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/cars/new",     label: "Add car",         icon: "+" },
          { href: "/admin/dealers/new",  label: "Add dealership",  icon: "🏢" },
          { href: "/admin/users/new",    label: "Create user",     icon: "👤" },
          { href: "/",                   label: "View site",        icon: "↗" },
        ].map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white transition-all"
          >
            <span>{icon}</span> {label}
          </a>
        ))}
      </div>
    </div>
  );
}
