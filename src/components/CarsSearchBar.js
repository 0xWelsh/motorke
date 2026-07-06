"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function CarsSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") || "");

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search makes, models, keywords..."
          className="w-full px-3 py-2 text-[11px] sm:text-[12px] bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
          style={{ borderRadius: "6px" }}
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-brand-accent bg-brand-accent text-white hover:opacity-90 transition-all cursor-pointer"
        style={{ borderRadius: "6px" }}
      >
        <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        Search
      </button>
    </form>
  );
}
