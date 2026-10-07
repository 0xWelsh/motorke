"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { BRANDS } from "@/lib/browse-catalog";
import { trackUiEvent } from "@/lib/analytics";

const selectCls =
  "w-full border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-900 outline-none focus:border-[var(--accent)] rounded-lg";

const labelCls = "text-[9px] font-black uppercase tracking-[0.16em] text-slate-400";

export default function HomepageHeroCarFinder({ embedded = false, className = "" }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (!make) {
      setModels([]);
      setModel("");
      return;
    }

    let cancelled = false;
    setLoadingModels(true);
    fetch(`/api/cars/models?make=${encodeURIComponent(make)}&limit=200`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setModels(Array.isArray(data?.models) ? data.models : []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [make]);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const q = params.toString();
    trackUiEvent("homepage_finder_submit", {
      make: make || "",
      model: model || "",
      budget: maxPrice || "",
    });
    router.push(q ? `/cars?${q}` : "/cars");
  }

  const fieldGrid = embedded
    ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3";

  return (
    <div
      className={
        embedded
          ? `h-full w-full rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm ${className}`.trim()
          : `mt-8 sm:mt-10 lg:mt-12 w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm ${className}`.trim()
      }
      style={{ borderRadius: "var(--radius)" }}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-1 ${
          embedded ? "text-left" : "text-center"
        }`}
      >
        Find your car
      </p>
      <h2
        className={`font-bold text-slate-900 mb-3 sm:mb-4 ${
          embedded ? "text-base text-left" : "text-lg sm:text-xl text-center mb-4 sm:mb-5"
        }`}
      >
        What are you looking for?
      </h2>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className={fieldGrid}>
          <div className="space-y-1">
            <label htmlFor="hero-make" className={labelCls}>
              Brand
            </label>
            <select
              id="hero-make"
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel("");
              }}
              className={selectCls}
              style={{ borderRadius: "var(--radius)" }}
            >
              <option value="">Any brand</option>
              {BRANDS.map((b) => (
                <option key={b.name} value={b.make || b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-model" className={labelCls}>
              Model
            </label>
            <select
              id="hero-model"
              value={model}
              disabled={!make || loadingModels}
              onChange={(e) => setModel(e.target.value)}
              className={`${selectCls} disabled:opacity-50`}
              style={{ borderRadius: "var(--radius)" }}
            >
              <option value="">{make ? "Any model" : "Select brand first"}</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-budget" className={labelCls}>
              Max budget (KES)
            </label>
            <select
              id="hero-budget"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className={selectCls}
              style={{ borderRadius: "var(--radius)" }}
            >
              <option value="">No limit</option>
              <option value="1300000">Up to 1.3M</option>
              <option value="2600000">Up to 2.6M</option>
              <option value="3900000">Up to 3.9M</option>
              <option value="6500000">Up to 6.5M</option>
              <option value="9750000">Up to 9.8M</option>
              <option value="13000000">Up to 13M</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
        >
          <Search className="h-4 w-4" aria-hidden />
          Search listings
        </button>
      </form>
    </div>
  );
}
