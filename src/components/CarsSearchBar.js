"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

function SearchForm({ value, setValue, onSubmit, disabled = false }) {
  return (
    <form onSubmit={onSubmit} className="flex items-stretch gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Search makes, models, keywords..."
          className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[13px] font-semibold text-text shadow-sm placeholder:font-normal placeholder:text-dim transition-colors focus:border-[var(--accent)] focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent-glow"
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={disabled}>
        <Search className="h-3.5 w-3.5" />
        Search
      </button>
    </form>
  );
}

function CarsSearchBarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

  // Seed + keep the input in sync with the URL (avoids a stale term after
  // navigating between /cars?search= states while the component stays mounted).
  useEffect(() => {
    setValue(searchParams.get("search") || "");
  }, [searchParams]);

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

  return <SearchForm value={value} setValue={setValue} onSubmit={handleSubmit} />;
}

// useSearchParams must live behind a Suspense boundary so statically
// prerendered pages (home, SEO hubs) don't bail to client-side rendering.
export default function CarsSearchBar() {
  return (
    <Suspense
      fallback={<SearchForm value="" setValue={() => {}} onSubmit={(e) => e.preventDefault()} disabled />}
    >
      <CarsSearchBarInner />
    </Suspense>
  );
}