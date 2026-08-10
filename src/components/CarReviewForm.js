"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export default function CarReviewForm({ carId, onReviewSubmitted }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/cars/${carId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status} ${res.statusText}`);
      }

      setSuccess(true);
      setRating(0);
      setComment("");
      router.refresh();
      if (onReviewSubmitted) onReviewSubmitted(data);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Review submission error:", err);
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 bg-white p-5 sm:p-6 rounded-xl">
      <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--accent)] mb-4">Share your experience</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Rate this car</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 p-1"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Your review (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What stood out about this car?"
            maxLength={500}
            className="w-full border border-slate-300 p-3 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded-xl"
            rows={4}
          />
          <p className="text-xs text-slate-500 mt-1">{comment.length}/500</p>
        </div>

        {/* Messages */}
        {error && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 rounded-xl">{error}</p>}
        {success && <p className="text-sm text-[var(--accent)] font-semibold bg-emerald-50 p-3 border border-emerald-200 rounded-xl">Review submitted. Thank you!</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !rating}
          className="w-full btn btn-primary btn-lg"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
