"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export default function DealerReviewForm({ dealerSlug, onReviewSubmitted }) {
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
      const res = await fetch(`/api/dealers/${dealerSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setRating(0);
      setComment("");
      router.refresh();
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#ddd4c8] rounded-2xl p-6 bg-surface">
      <h3 className="text-lg font-bold text-text mb-4">Rate This Dealer</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="text-sm font-bold text-secondary mb-2 block">How would you rate this dealership?</label>
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
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-ghost"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-bold text-secondary mb-2 block">Your review (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this dealer..."
            maxLength={500}
            className="w-full border border-[#ddd4c8] rounded-2xl p-3 text-sm font-semibold placeholder:text-dim focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)] outline-none"
            rows={4}
          />
          <p className="text-xs text-dim mt-1">{comment.length}/500</p>
        </div>

        {/* Messages */}
        {error && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 rounded">{error}</p>}
        {success && <p className="text-sm text-emerald-700 font-semibold bg-emerald-50 p-3 rounded border border-emerald-200">Thank you for your review!</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !rating}
          className="w-full bg-[var(--accent)] text-white font-bold py-3 rounded-2xl hover:bg-[var(--accent-hover)] disabled:bg-surface-overlay transition-colors"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
