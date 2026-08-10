import Link from "next/link";
import { getTrendingSearches } from "@/lib/seo-trending";
import { TrendingUp } from "lucide-react";

export default async function TrendingSearches({ limit = 10, className = "" }) {
  const trending = await getTrendingSearches({ limit });
  if (!trending.length) return null;

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-[var(--accent)]" aria-hidden />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Trending searches
        </h2>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {trending.map((item) => (
          <li key={item.query}>
            <Link
              href={item.href}
              className="inline-block px-2.5 py-1 text-[11px] font-semibold border border-slate-200 bg-white text-slate-500 hover:border-slate-400 transition-colors rounded-xl"
            >
              {item.query}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
