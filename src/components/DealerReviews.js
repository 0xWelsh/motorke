"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatReviewDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPurchaseMonth(value) {
  const date = new Date(value);
  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
  });
}

function Stars({ rating, size = "sm" }) {
  const className = size === "lg" ? "text-lg" : "text-sm";
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <span key={index} className={index <= rating ? "text-amber-500" : "text-slate-200"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function DealerReviews({
  dealerSlug,
  dealerName,
  averageRating,
  totalReviews,
  reviews,
  viewer,
  viewerReview,
}) {
  const router = useRouter();
  const [rating, setRating] = useState(viewerReview?.rating || 5);
  const [comment, setComment] = useState(viewerReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canReview = Boolean(viewer) && !(viewer.role === "DEALER" && viewer.dealerId);

  const reviewCallout = useMemo(() => {
    if (totalReviews === 0) return "No reviews yet";
    return `${averageRating.toFixed(1)} out of 5 from ${totalReviews} review${totalReviews === 1 ? "" : "s"}`;
  }, [averageRating, totalReviews]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (rating < 1 || rating > 5) {
      setError("Pick a rating between 1 and 5.");
      return;
    }

    if (comment.trim().length > 500) {
      setError("Review text is too long.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/dealers/${dealerSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Unable to save review right now.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      router.refresh();
    } catch (submitError) {
      console.error("Failed to submit dealer review:", submitError);
      setError("Unable to save review right now.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-10">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-2">Buyer Reviews</p>
        <h2 className="text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">What buyers say about {dealerName}</h2>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Stars rating={Math.round(averageRating || 0)} size="lg" />
          <p className="text-sm font-bold text-slate-600">{reviewCallout}</p>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[#ece6dd] bg-[#fcfbf8] px-5 py-5">
            <p className="text-sm font-semibold text-slate-600">No buyer reviews have been posted yet. Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-[#ece6dd] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{review.user?.name || "Buyer"}</p>
                      <span className="inline-flex items-center border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] rounded">
                        Verified buyer
                      </span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mt-0.5">{formatReviewDate(review.createdAt)}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1">Purchase month: {formatPurchaseMonth(review.createdAt)}</p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="h-fit border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111111] p-5 sm:p-6 shadow-sm" style={{ borderRadius: "var(--radius)" }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#718096] dark:text-slate-500 mb-2">Share your experience</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
          Help other buyers understand response speed, transparency, and after-sales quality.
        </p>
        {!viewer && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">Sign in to rate this dealership and help other buyers choose confidently.</p>
            <Link href="/login" className="inline-flex items-center bg-[#111827] dark:bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white dark:text-black hover:bg-black dark:hover:bg-slate-200 transition-colors" style={{ borderRadius: "var(--radius)" }}>
              Log In to Review
            </Link>
          </div>
        )}

        {viewer && !canReview && (
          <p className="text-sm text-slate-600 font-semibold">Dealership accounts cannot submit buyer reviews.</p>
        )}

        {viewer && canReview && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Rating</label>
              <select
                value={rating}
                onChange={(event) => setRating(parseInt(event.target.value, 10))}
                className="mt-1 w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#38A169]"
                style={{ borderRadius: "var(--radius)" }}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Very good</option>
                <option value={3}>3 - Good</option>
                <option value={2}>2 - Fair</option>
                <option value={1}>1 - Poor</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="How was your experience with this dealer?"
                className="mt-1 w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-[#38A169] resize-none"
                style={{ borderRadius: "var(--radius)" }}
              />
              <p className="mt-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">{comment.trim().length}/500</p>
            </div>

            {error && <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" style={{ borderRadius: "var(--radius)" }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center bg-[#38A169] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-[#2f855a] disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: "var(--radius)" }}
            >
              {submitting ? "Saving..." : viewerReview ? "Update Review" : "Post Review"}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
