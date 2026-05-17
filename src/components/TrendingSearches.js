import Link from "next/link";
import { getTrendingSearches } from "@/lib/seo-trending";
import { TrendingUp } from "lucide-react";

export default async function TrendingSearches({ limit = 10, className = "" }) {
  const trending = await getTrendingSearches({ limit });
  if (!trending.length) return null;

  return (
    <section
      className={`rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/40 px-4 py-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[#2F855A]" aria-hidden />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Trending searches
        </h2>
      </div>
      <ul className="flex flex-wrap gap-2">
        {trending.map((item) => (
          <li key={item.query}>
            <Link
              href={item.href}
              className="inline-block px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-800 dark:text-slate-200 hover:border-slate-900 dark:hover:border-white transition-colors"
              style={{ borderRadius: "var(--radius)" }}
            >
              {item.query}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
