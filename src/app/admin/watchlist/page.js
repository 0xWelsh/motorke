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
          icon={<Bookmark size={32} className="text-dim" />}
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
          <h1 className="text-2xl font-black text-text tracking-tight">Watchlist</h1>
          <p className="text-sm text-muted mt-1">
            {total} saves by {uniqueUsers} users across {uniqueCars} cars
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-2xl font-black text-text">{total}</p>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">Total Saves</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-2xl font-black text-text">{uniqueUsers}</p>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">Unique Users</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-2xl font-black text-text">{uniqueCars}</p>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">Unique Cars</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-hover">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">Car</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">User</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">Saved At</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">Car ID</th>
              </tr>
            </thead>
            <tbody>
              {savedCars.map((s) => (
                <tr key={`${s.userId}-${s.carId}`} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={carListingPath(s.car)}
                      target="_blank"
                      className="font-semibold text-text hover:text-[#38A169] transition-colors"
                    >
                      {s.car.year} {s.car.make} {s.car.model}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-dim shrink-0" />
                      <span className="text-secondary">{s.user.name}</span>
                      <span className="text-[10px] text-dim">({s.user.email})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-muted">
                      <Clock size={12} />
                      <span className="text-xs">{fmtDate(s.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <code className="text-[10px] text-dim font-mono">{s.carId.slice(0, 8)}...</code>
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
