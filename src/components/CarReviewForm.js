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
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Review submission error:", err);
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-6 bg-white">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Share Your Experience</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Rate this car</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Your review (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this car..."
            maxLength={500}
            className="w-full border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-3 text-sm font-semibold placeholder:text-slate-400 focus:border-[#ff5a2f] focus:ring-2 focus:ring-blue-100 outline-none"
            rows={4}
          />
          <p className="text-xs text-slate-400 mt-1">{comment.length}/500</p>
        </div>

        {/* Messages */}
        {error && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 rounded">{error}</p>}
        {success && <p className="text-sm text-emerald-700 font-semibold bg-emerald-50 p-3 rounded-2xl border border-emerald-200">Review submitted! Thank you.</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !rating}
          className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
