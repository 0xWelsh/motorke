"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import CarReviewForm from "@/components/CarReviewForm";

function calcAvg(reviews = []) {
  if (!reviews.length) return null;
  const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return (sum / reviews.length).toFixed(1);
}

function formatReviewAge(dateValue) {
  if (!dateValue) return "Recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = date.getTime() - Date.now();
  const absSec = Math.abs(diffMs) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSec < 45) return "Just now";
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60000), "minute");
  if (absSec < 86400) return rtf.format(Math.round(diffMs / 3600000), "hour");
  if (absSec < 2592000) return rtf.format(Math.round(diffMs / 86400000), "day");
  if (absSec < 31536000) return rtf.format(Math.round(diffMs / 2592000000), "month");
  return rtf.format(Math.round(diffMs / 31536000000), "year");
}

export default function CarReviewsSection({ carId, initialReviews = [], initialAvgRating = null }) {
  const [reviews, setReviews] = useState(initialReviews);

  const average = useMemo(() => {
    if (reviews.length) return calcAvg(reviews);
    if (initialAvgRating == null) return null;
    return Number(initialAvgRating).toFixed(1);
  }, [reviews, initialAvgRating]);

  function handleReviewSubmitted(review) {
    if (!review?.id || !review?.user?.id) return;
    setReviews((prev) => {
      const withoutSameUser = prev.filter((item) => item?.user?.id !== review.user.id);
      return [review, ...withoutSameUser].slice(0, 10);
    });
  }

  return (
    <div className="mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-white/[0.06]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-7 sm:mb-10 gap-4 sm:gap-6">
        <div>
          <h2 className="font-serif text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--accent)] mb-2 sm:mb-3">User Feedback</h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">What buyers say</h3>
        </div>
        {average && (
          <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(parseFloat(average)) ? "fill-current" : "text-zinc-600"}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-white">{average}</span>
          </div>
        )}
      </div>

      <div className="space-y-6 sm:space-y-8">
        <CarReviewForm carId={carId} onReviewSubmitted={handleReviewSubmitted} />
        <div className="space-y-3 sm:space-y-4">
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <div key={r.id} className="border border-white/[0.06] bg-[#222222] p-4 sm:p-5 rounded-xl">
                <div className="flex items-center justify-between gap-4 mb-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center overflow-hidden ring-1 ring-white/[0.06]">
                      {r.user?.avatarUrl ? (
                        <Image src={r.user.avatarUrl} alt={`${r.user.name} avatar`} fill className="object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400">{r.user?.name?.[0] || "U"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">{r.user?.name || "User"}</span>
                      <span
                        className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 mt-0.5"
                        title={r.createdAt ? new Date(r.createdAt).toLocaleString("en-KE") : ""}
                      >
                        {formatReviewAge(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex text-amber-400 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-current" : "text-zinc-600"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{r.comment || "No comment provided."}</p>
              </div>
            ))
          ) : (
            <p className="border border-dashed border-white/[0.06] px-4 py-5 text-sm text-zinc-500 rounded-xl">No reviews yet for this unit.</p>
          )}
        </div>
      </div>
    </div>
  );
}
