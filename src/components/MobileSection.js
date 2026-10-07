"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

// On phones (<lg) wraps children in a collapsed "More…" accordion so long
// SEO blocks don't force endless scrolling. On desktop it renders flat.
// Server-renders EXPANDED so the content stays in the HTML for search engines;
// the collapse only kicks in after hydration on small screens.
export default function MobileSection({ summary = "More about this car", children }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setCollapsed(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!collapsed) return <>{children}</>;

  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[var(--sidebar-bar)] px-4 py-3 text-[12px] font-black uppercase tracking-widest text-white">
        <span>{summary}</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-5 p-4">{children}</div>
    </details>
  );
}