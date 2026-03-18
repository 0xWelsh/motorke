// src/app/portal/page.js
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, formatMileage } from "@/lib/utils";

export const metadata = { title: "My Listings — Motorke Portal" };

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">My listings</h1>
          <p className="text-white/40 text-sm mt-1">{user.dealer?.name}</p>
        </div>
        <a href="/portal/cars/new"
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          + Add car
        </a>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Live",      value: live,   color: "text-green-400"  },
          { label: "Hidden",    value: hidden, color: "text-white/30"   },
          { label: "Enquiries", value: leads,  color: "text-[#f97316]"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Car list */}
      {cars.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-2xl">
          <p className="text-5xl mb-4">🚗</p>
          <p className="text-lg font-bold mb-2">No listings yet</p>
          <p className="text-white/40 text-sm mb-6">Add your first car to start appearing on Motorke</p>
          <a href="/portal/cars/new"
            className="bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Add your first car
          </a>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-5 py-4">Car</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Price</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Mileage</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Status</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                        {car.images[0]
                          ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover" />
                          : <div className="flex items-center justify-center h-full">🚗</div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{car.year} {car.make} {car.model}</p>
                        {car.variant && <p className="text-xs text-white/30">{car.variant}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#f97316] hidden sm:table-cell">
                    {formatPrice(car.price)}
                  </td>
                  <td className="px-4 py-4 text-sm text-white/40 hidden md:table-cell">
                    {formatMileage(car.mileage)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      car.available
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "bg-white/5 text-white/30 border border-white/10"
                    }`}>
                      {car.available ? "Live" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <a href={`/portal/cars/${car.id}/edit`}
                        className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all">
                        Edit
                      </a>
                      <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                        <button type="submit"
                          className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all">
                          {car.available ? "Hide" : "Show"}
                        </button>
                      </form>
                      <a href={`/cars/${car.id}`} target="_blank"
                        className="text-xs text-[#f97316]/60 hover:text-[#f97316] border border-[#f97316]/20 rounded-lg px-3 py-1.5 transition-all">
                        View ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
