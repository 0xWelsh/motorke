"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const FALLBACK_NEWS = [
  { id: "f-1", title: "Fresh inventory added daily from verified dealers", url: "/cars", sourceName: "Motorke" },
  { id: "f-2", title: "Compare vehicle options before contacting a seller", url: "/compare", sourceName: "Motorke" },
  { id: "f-3", title: "Browse trusted dealership profiles across Kenya", url: "/dealers", sourceName: "Motorke" },
  { id: "f-4", title: "Get market updates and pricing signals in one place", url: "/portal/intelligence", sourceName: "Motorke" },
];

function normalizeNews(items = []) {
  return items
    .map((item, idx) => ({
      id: item?.id || `news-${idx}`,
      title: String(item?.title || "").trim(),
      url: String(item?.url || "").trim(),
      sourceName: String(item?.sourceName || "Market").trim(),
    }))
    .filter((item) => item.title && item.url);
}

export default function NewsRibbon({ initialNews = [] }) {
  const [news, setNews] = useState(() => normalizeNews(initialNews));

  useEffect(() => {
    let mounted = true;

    async function fetchNews() {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        if (!mounted || !Array.isArray(payload)) return;

        const normalized = normalizeNews(payload.slice(0, 12));
        if (normalized.length > 0) setNews(normalized);
      } catch {
        // Keep current items if network/API fails.
      }
    }

    fetchNews();
    const id = setInterval(fetchNews, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const baseItems = news.length > 0 ? news : FALLBACK_NEWS;
  const tickerItems = useMemo(() => [...baseItems, ...baseItems], [baseItems]);

  return (
    <div className="mk-news-ribbon mb-6 sm:mb-8" aria-label="Latest automotive news">
      <div className="h-9 sm:h-10 px-3 sm:px-4 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a2f] animate-pulse" />
          News
        </span>

        <div className="relative flex-1 overflow-hidden">
          <div className="mk-news-track">
            {tickerItems.map((item, idx) => {
              const internal = item.url.startsWith("/");

              return internal ? (
                <Link
                  key={`${item.id}-${idx}`}
                  href={item.url}
                  className="mk-news-item"
                  title={item.title}
                >
                  <span className="mk-news-source">{item.sourceName}</span>
                  <span className="mk-news-title">{item.title}</span>
                </Link>
              ) : (
                <a
                  key={`${item.id}-${idx}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mk-news-item"
                  title={item.title}
                >
                  <span className="mk-news-source">{item.sourceName}</span>
                  <span className="mk-news-title">{item.title}</span>
                </a>
              );
            })}
          </div>
        </div>

        <span className="hidden md:inline text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 shrink-0">
          Refresh 5m
        </span>
      </div>
    </div>
  );
}
