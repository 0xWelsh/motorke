// src/app/admin/cars/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "All Cars — Admin" };

export default async function AdminCarsPage({ searchParams }) {
  await requireAdmin();

  const search   = searchParams.search || "";
  const dealerId = searchParams.dealerId || "";
  const page     = parseInt(searchParams.page || "1");
  const limit    = 20;

  const where = {
    ...(search   && { OR: [
      { make:  { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ]}),
    ...(dealerId && { dealerId }),
  };

  const [cars, total, dealers] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        dealer: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.car.count({ where }),
    db.dealer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">All cars <span className="text-white/30 text-xl font-normal">({total})</span></h1>
        <a href="/admin/cars/new"
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          + Add car
        </a>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 mb-6">
        <input name="search" defaultValue={search} placeholder="Search make / model…"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f97316]/40 w-56" />
        <select name="dealerId" defaultValue={dealerId}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70 outline-none focus:border-[#f97316]/40">
          <option value="">All dealers</option>
          {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit" className="bg-white/10 hover:bg-white/15 text-sm text-white px-4 py-2 rounded-xl transition-colors">Filter</button>
        {(search || dealerId) && <a href="/admin/cars" className="text-sm text-white/40 hover:text-white px-2 flex items-center">Clear</a>}
      </form>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-5 py-4">Car</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Dealer</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Price</th>
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
                        : <div className="flex items-center justify-center h-full text-lg">🚗</div>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{car.year} {car.make} {car.model}</p>
                      {car.variant && <p className="text-xs text-white/30">{car.variant}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-white/60">{car.dealer.name}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#f97316]">{formatPrice(car.price)}</td>
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
                    <a href={`/admin/cars/${car.id}/edit`}
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

        {cars.length === 0 && (
          <div className="text-center py-16 text-white/30">No cars found</div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(total / limit) > 1 && (
        <div className="flex gap-2 mt-5">
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
            <a key={p}
              href={`/admin/cars?page=${p}&search=${search}&dealerId=${dealerId}`}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                p === page ? "bg-[#f97316] text-white" : "bg-white/5 text-white/40 hover:text-white"
              }`}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
