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
    <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search makes, models, keywords..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] font-semibold text-slate-900 shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-colors focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/25"
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary"
      >
        <Search className="h-3.5 w-3.5" />
        Search
      </button>
    </form>
  );
}
