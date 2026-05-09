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
    <div className="mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-[#EDF2F7] dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-7 sm:mb-10 gap-4 sm:gap-6">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#38A169] mb-2 sm:mb-3">User Feedback</h2>
          <h3 className="text-2xl sm:text-4xl font-bold text-[#1A202C] dark:text-white">Experience Shared.</h3>
          <p className="mt-2 text-[13px] sm:text-sm text-slate-500 dark:text-slate-400">See what verified buyers are saying about this listing.</p>
        </div>
        {average && (
          <div className="self-start sm:self-auto flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-[#F7FAFC] dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-xl sm:rounded-2xl" style={{ borderRadius: "var(--radius)" }}>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(average)) ? "fill-current" : "text-[#CBD5E0]"}`} />
              ))}
            </div>
            <span className="text-base sm:text-lg font-bold text-[#1A202C] dark:text-white">{average} / 5.0</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-16">
        <div className="lg:col-span-4">
          <CarReviewForm carId={carId} onReviewSubmitted={handleReviewSubmitted} />
        </div>
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <div key={r.id} className="rounded-xl sm:rounded-2xl border border-[#EDF2F7] dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full bg-[#EDF2F7] dark:bg-zinc-800 flex items-center justify-center overflow-hidden ring-1 ring-slate-200/70 dark:ring-zinc-700">
                      {r.user?.avatarUrl ? (
                        <Image src={r.user.avatarUrl} alt={`${r.user.name} avatar`} fill className="object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold">{r.user?.name?.[0] || "U"}</span>
                      )}
                    </div>
                    <span className="text-[13px] sm:text-sm font-bold text-[#1A202C] dark:text-white">{r.user?.name || "User"}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-current" : "text-[#CBD5E0]"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[14px] sm:text-base text-[#718096] dark:text-slate-300 leading-relaxed font-medium">{r.comment || "No comment provided."}</p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300/70 dark:border-zinc-700 px-4 py-5 text-[#718096] dark:text-slate-300 font-medium text-sm">No reviews yet for this unit.</p>
          )}
        </div>
      </div>
    </div>
  );
}
