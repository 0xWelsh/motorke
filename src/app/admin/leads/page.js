// src/app/admin/leads/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Enquiries — Admin" };

export default async function AdminLeadsPage({ searchParams }) {
  await requireAdmin();

  const dealerId = searchParams.dealerId || "";
  const page     = parseInt(searchParams.page || "1");
  const limit    = 25;

  const where = dealerId ? { dealerId } : {};

  const [leads, total, dealers] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        car:    { select: { id: true, make: true, model: true, year: true } },
        dealer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.lead.count({ where }),
    db.dealer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">
          Enquiries <span className="text-white/30 text-xl font-normal">({total})</span>
        </h1>
      </div>

      {/* Filter */}
      <form method="GET" className="flex gap-3 mb-6">
        <select name="dealerId" defaultValue={dealerId}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70 outline-none focus:border-[#f97316]/40">
          <option value="">All dealers</option>
          {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit"
          className="bg-white/10 hover:bg-white/15 text-sm text-white px-4 py-2 rounded-xl transition-colors">
          Filter
        </button>
        {dealerId && <a href="/admin/leads" className="text-sm text-white/40 hover:text-white px-2 flex items-center">Clear</a>}
      </form>

      {leads.length === 0 ? (
        <div className="text-center py-24 text-white/30">No enquiries yet</div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-5 py-4">Buyer</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Car</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Dealer</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Message</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">{lead.name}</p>
                    <p className="text-xs text-white/30">{lead.phone}</p>
                    {lead.email && <p className="text-xs text-white/30">{lead.email}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <a href={`/cars/${lead.car.id}`} target="_blank"
                      className="text-sm text-[#f97316] hover:text-orange-400 transition-colors">
                      {lead.car.year} {lead.car.make} {lead.car.model}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/50 hidden md:table-cell">
                    {lead.dealer.name}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <p className="text-xs text-white/40 max-w-xs truncate">
                      {lead.message || <span className="italic text-white/20">No message</span>}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-white/30 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {Math.ceil(total / limit) > 1 && (
        <div className="flex gap-2 mt-5">
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
            <a key={p}
              href={`/admin/leads?page=${p}&dealerId=${dealerId}`}
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
