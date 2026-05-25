"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { BRANDS, BODY_TYPES, COUNTIES } from "@/lib/browse-catalog";

const selectCls =
  "w-full border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-[#111827] outline-none focus:border-[#38A169] dark:border-zinc-800 dark:bg-zinc-950 dark:text-white";

const labelCls = "text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

export default function HomepageHeroCarFinder({ embedded = false }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [carVariant, setCarVariant] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [county, setCounty] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (!make) {
      setModels([]);
      setModel("");
      setVariants([]);
      setCarVariant("");
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

  useEffect(() => {
    if (!make || !model) {
      setVariants([]);
      setCarVariant("");
      return;
    }

    let cancelled = false;
    setLoadingVariants(true);
    fetch(
      `/api/cars/variants?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&limit=120`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setVariants(Array.isArray(data?.variants) ? data.variants : []);
      })
      .catch(() => {
        if (!cancelled) setVariants([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingVariants(false);
      });

    return () => {
      cancelled = true;
    };
  }, [make, model]);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (bodyType) params.set("bodyType", bodyType);
    if (county) params.set("county", county);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (carVariant.trim()) params.set("search", carVariant.trim());
    const q = params.toString();
    router.push(q ? `/cars?${q}` : "/cars");
  }

  const fieldGrid = embedded
    ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3";

  return (
    <div
      className={
        embedded
          ? "h-full w-full rounded-xl border border-slate-200/90 bg-white/95 p-3 sm:p-4 shadow-sm dark:border-zinc-800 dark:bg-[#111111]/92"
          : "mt-8 sm:mt-10 lg:mt-12 w-full max-w-4xl mx-auto rounded-2xl border border-slate-200/80 bg-white/95 dark:bg-[#111111]/95 p-4 sm:p-5 md:p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.45)] dark:border-zinc-800"
      }
      style={{ borderRadius: "var(--radius)" }}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] text-[#38A169] mb-1 ${
          embedded ? "text-left" : "text-center"
        }`}
      >
        Find your car
      </p>
      <h2
        className={`font-bold text-[#111827] dark:text-white mb-3 sm:mb-4 ${
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
                setCarVariant("");
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
              onChange={(e) => {
                setModel(e.target.value);
                setCarVariant("");
              }}
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
            <label htmlFor="hero-variant" className={labelCls}>
              Variant
            </label>
            <select
              id="hero-variant"
              value={carVariant}
              disabled={!model || loadingVariants}
              onChange={(e) => setCarVariant(e.target.value)}
              className={`${selectCls} disabled:opacity-50`}
              style={{ borderRadius: "var(--radius)" }}
            >
              <option value="">{model ? "Any variant" : "Select model first"}</option>
              {variants.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-body" className={labelCls}>
              Body type
            </label>
            <select
              id="hero-body"
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className={selectCls}
              style={{ borderRadius: "var(--radius)" }}
            >
              <option value="">Any shape</option>
              {BODY_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {bt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-county" className={labelCls}>
              Location
            </label>
            <select
              id="hero-county"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className={selectCls}
              style={{ borderRadius: "var(--radius)" }}
            >
              <option value="">Anywhere in Kenya</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
          className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#38A169] hover:bg-[#2F855A] text-white text-xs font-black uppercase tracking-widest transition-colors"
          style={{ borderRadius: "var(--radius)" }}
        >
          <Search className="h-4 w-4" aria-hidden />
          Search listings
        </button>
      </form>
    </div>
  );
}
