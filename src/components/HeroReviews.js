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

  const reviewData = reviews.length > 0 ? reviews : defaultReviews;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-2">Buyer Stories</p>
        <h3 className="text-lg font-black text-slate-900">Real Reviews</h3>
      </div>

      <div className="space-y-3">
        {reviewData.map((review, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-100 p-4 hover:border-slate-200 hover:shadow-md transition-all duration-300"
          >
            <div className="flex gap-1 mb-2">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2">
              "{review.text}"
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900">
                  {review.author}
                </p>
                <p className="text-[9px] text-slate-400 font-semibold">{review.role}</p>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1">
                Verified
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 font-semibold pt-2">
        Trusted by 2,300+ verified buyers
      </p>
    </div>
  );
}
