import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Bookmark, User, Clock } from "lucide-react";
import { carListingPath } from "@/lib/car-listing-url";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Watchlist | BIDGARI Admin" };

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AdminWatchlistPage() {
  await requireAdmin();

  const savedCars = await db.savedCar.findMany({
    include: {
      car: {
        select: {
          id: true,
          publicSlug: true,
          make: true,
          model: true,
          year: true,
          price: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = savedCars.length;
  const uniqueUsers = new Set(savedCars.map((s) => s.user.id)).size;
  const uniqueCars = new Set(savedCars.map((s) => s.car.id)).size;

  if (total === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Bookmark size={32} className="text-slate-400" />}
          title="No saved cars"
          desc="No users have saved any cars yet."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Watchlist</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} saves by {uniqueUsers} users across {uniqueCars} cars
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-2xl font-black text-slate-900">{total}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Saves</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-2xl font-black text-slate-900">{uniqueUsers}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Unique Users</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-2xl font-black text-slate-900">{uniqueCars}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Unique Cars</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Car</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">User</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Saved At</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Car ID</th>
              </tr>
            </thead>
            <tbody>
              {savedCars.map((s) => (
                <tr key={`${s.userId}-${s.carId}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={carListingPath(s.car)}
                      target="_blank"
                      className="font-semibold text-slate-900 hover:text-[#38A169] transition-colors"
                    >
                      {s.car.year} {s.car.make} {s.car.model}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-slate-400 shrink-0" />
                      <span className="text-slate-700">{s.user.name}</span>
                      <span className="text-[10px] text-slate-400">({s.user.email})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={12} />
                      <span className="text-xs">{fmtDate(s.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <code className="text-[10px] text-slate-400 font-mono">{s.carId.slice(0, 8)}...</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
