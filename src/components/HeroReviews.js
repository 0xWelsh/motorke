import { db } from "@/lib/db";
import { Star } from "lucide-react";

// Fetches up to 3 real dealer reviews that have a comment
async function getHighlightReviews() {
  return db.dealerReview.findMany({
    where: { comment: { not: null } },
    include: { user: { select: { name: true } }, dealer: { select: { county: true } } },
    orderBy: { rating: "desc" },
    take: 3,
  });
}

export default async function HeroReviews() {
  const reviews = await getHighlightReviews();

  if (reviews.length === 0) return null;

  return (
    <div className="space-y-3 py-2 border-y border-[#e8e2d9]">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-2">Buyer Reviews</p>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Real Feedback</h3>
      </div>

      <div className="space-y-2">
        {reviews.slice(0, 2).map((review) => (
          <div key={review.id} className="bg-white dark:bg-[#111111] border border-slate-50 p-2.5 text-xs">
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-700 line-clamp-2 mb-1">
              &ldquo;{review.comment}&rdquo;
            </p>
            <p className="text-[9px] font-bold text-slate-600">
              {review.user?.name || "Verified Buyer"}
              {review.dealer?.county ? `, ${review.dealer.county}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
