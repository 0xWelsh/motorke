export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import DeleteButton from "@/components/DeleteButton";
import { Star, MessageSquare, Building2, Car, ShieldAlert } from "lucide-react";

export const metadata = { title: "Review Moderation | BIDGARI Admin" };

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? "fill-[var(--accent)] text-[var(--accent)]" : "text-zinc-600"}
        />
      ))}
    </div>
  );
}

export default async function AdminReviewsPage() {
  await requireAdmin();

  const [dealerReviews, carReviews] = await Promise.all([
    db.dealerReview.findMany({
      include: {
        user:   { select: { id: true, name: true, email: true } },
        dealer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.carReview.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        car:  { select: { id: true, make: true, model: true, year: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-6xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(47,133,90,0.45)]" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Moderation</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Review Moderation
        </h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">
          {dealerReviews.length + carReviews.length} total reviews &mdash; remove any that violate community guidelines.
        </p>
      </div>

      {/* Dealer Reviews */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Building2 size={16} className="text-[var(--accent)]" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300">
            Dealer Reviews <span className="text-zinc-400 font-semibold">({dealerReviews.length})</span>
          </h2>
        </div>

        {dealerReviews.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400 font-semibold">No dealer reviews yet.</p>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                    {["Reviewer", "Dealer", "Rating", "Comment", "Date", ""].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {dealerReviews.map((r) => (
                    <tr key={r.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">{r.user.name}</p>
                        <p className="text-[11px] text-zinc-400">{r.user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-zinc-300 capitalize">{r.dealer.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StarDisplay rating={r.rating} />
                        <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{r.rating}/5</p>
                      </td>
                      <td className="px-6 py-4 max-w-[280px]">
                        <p className="text-sm text-zinc-400 line-clamp-2">{r.comment || <span className="text-zinc-300">No comment</span>}</p>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-zinc-400 font-semibold whitespace-nowrap">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <DeleteButton
                          action={`/api/admin/reviews/dealer/${r.id}/delete`}
                          message="Permanently delete this dealer review?"
                          label="Delete"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Car Reviews */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Car size={16} className="text-[var(--accent)]" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300">
            Car Reviews <span className="text-zinc-400 font-semibold">({carReviews.length})</span>
          </h2>
        </div>

        {carReviews.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400 font-semibold">No car reviews yet.</p>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                    {["Reviewer", "Vehicle", "Rating", "Comment", "Date", ""].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {carReviews.map((r) => (
                    <tr key={r.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">{r.user.name}</p>
                        <p className="text-[11px] text-zinc-400">{r.user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold font-sans text-zinc-300">{r.car.year} {r.car.make} {r.car.model}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StarDisplay rating={r.rating} />
                        <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{r.rating}/5</p>
                      </td>
                      <td className="px-6 py-4 max-w-[280px]">
                        <p className="text-sm text-zinc-400 line-clamp-2">{r.comment || <span className="text-zinc-300">No comment</span>}</p>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-zinc-400 font-semibold whitespace-nowrap">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <DeleteButton
                          action={`/api/admin/reviews/car/${r.id}/delete`}
                          message="Permanently delete this car review?"
                          label="Delete"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
