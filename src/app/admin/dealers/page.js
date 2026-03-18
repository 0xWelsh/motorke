// src/app/admin/dealers/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Dealerships — Admin" };

export default async function AdminDealersPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: true, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">
          Dealerships <span className="text-white/30 text-xl font-normal">({dealers.length})</span>
        </h1>
        <a href="/admin/dealers/new"
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          + Add dealership
        </a>
      </div>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-5 py-4">Dealership</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">County</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Cars</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Users</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Status</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dealers.map((dealer) => (
              <tr key={dealer.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f97316]/20 flex items-center justify-center text-[#f97316] font-black flex-shrink-0">
                      {dealer.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{dealer.name}</p>
                      <p className="text-xs text-white/30">{dealer.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-white/50 hidden sm:table-cell">{dealer.county}</td>
                <td className="px-4 py-4 text-sm font-semibold text-[#f97316]">{dealer._count.cars}</td>
                <td className="px-4 py-4 text-sm text-white/50 hidden md:table-cell">{dealer._count.users}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-1.5">
                    {dealer.verified && (
                      <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">✓ Verified</span>
                    )}
                    {dealer.featured && (
                      <span className="text-[10px] bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/20 rounded-full px-2 py-0.5">⭐ Featured</span>
                    )}
                    {!dealer.verified && !dealer.featured && (
                      <span className="text-[10px] text-white/20">Basic</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <a href={`/admin/dealers/${dealer.id}/edit`}
                      className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all">
                      Edit
                    </a>
                    <a href={`/dealers/${dealer.slug}`} target="_blank"
                      className="text-xs text-[#f97316]/60 hover:text-[#f97316] border border-[#f97316]/20 rounded-lg px-3 py-1.5 transition-all">
                      View ↗
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dealers.length === 0 && (
          <div className="text-center py-16 text-white/30">No dealerships yet</div>
        )}
      </div>
    </div>
  );
}
