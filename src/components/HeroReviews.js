"use client";

import { Star } from "lucide-react";

export default function HeroReviews({ reviews = [] }) {
  const defaultReviews = [
    {
      text: "Found my dream Prado in 2 days. Process was smooth and dealer was genuine.",
      author: "Sarah M.",
      role: "Nairobi, Kenya",
      rating: 5,
    },
    {
      text: "Finally, a marketplace where specs are actually accurate. No surprises.",
      author: "James K.",
      role: "Mombasa, Kenya",
      rating: 5,
    },
    {
      text: "Saved hours comparing cars. The side-by-side tool is a game changer.",
      author: "Ahmed L.",
      role: "Kisumu, Kenya",
      rating: 5,
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  return (
    <div className="space-y-3 py-2 border-y border-[#e8e2d9]">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-2">Buyer Reviews</p>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Real Feedback</h3>
      </div>

      <div className="space-y-2">
        {displayReviews.slice(0, 2).map((review, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#111111] border border-slate-50 p-2.5 text-xs"
          >
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-3 h-3 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-700 line-clamp-2 mb-1">
              "{review.text}"
            </p>
            <p className="text-[9px] font-bold text-slate-600">
              {review.author}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-slate-400 font-semibold pt-1">
        Trusted by 2,300+ verified buyers
      </p>
    </div>
  );
}
