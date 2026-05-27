"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { BRANDS, BODY_TYPES, COUNTIES } from "@/lib/browse-catalog";
import {
  BUYER_REQUEST_CONDITIONS,
  BUYER_REQUEST_FEATURE_OPTIONS,
  BUYER_REQUEST_TIMELINES,
} from "@/lib/buyer-request";

const inputCls =
  "w-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#38A169] transition-colors";
const labelCls = "text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mb-1 block";

export default function BuyerRequestForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [website, setWebsite] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    make: "",
    model: "",
    variant: "",
    yearMin: "",
    yearMax: "",
    budgetMin: "",
    budgetMax: "",
    bodyType: "",
    fuelType: "",
    transmission: "",
    mileageMin: "",
    mileageMax: "",
    county: "Nairobi",
    timeline: "ASAP",
    conditionPref: "EITHER",
    features: [],
    notes: "",
    consentWhatsapp: true,
  });

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFeature(feature) {
    setForm((prev) => {
      const has = prev.features.includes(feature);
      return {
        ...prev,
        features: has
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature].slice(0, 8),
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/buyer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || "Could not submit your request. Please try again.");
        return;
      }
      setSuccess(data.publicCode);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/20 p-6 sm:p-8 text-center"
        style={{ borderRadius: "var(--radius)" }}
      >
        <CheckCircle className="w-12 h-12 text-[#38A169] mx-auto mb-4" aria-hidden />
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Request received
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto mb-4">
          Your reference is <span className="font-black text-[#38A169]">{success}</span>. Verified sellers
          will send offers through Welsh Motorhub on WhatsApp — usually within a few hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/requests"
            className="inline-flex items-center justify-center gap-2 bg-[#38A169] hover:bg-[#2F855A] text-white px-5 py-3 text-xs font-black uppercase tracking-widest"
            style={{ borderRadius: "var(--radius)" }}
          >
            View open requests <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/cars"
            className="inline-flex items-center justify-center border border-slate-200 dark:border-zinc-700 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white"
            style={{ borderRadius: "var(--radius)" }}
          >
            Browse inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="sr-only" aria-hidden>
        <label htmlFor="br-website">Website</label>
        <input
          id="br-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="br-name">
            Your name *
          </label>
          <input
            id="br-name"
            required
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="br-phone">
            WhatsApp number *
          </label>
          <input
            id="br-phone"
            required
            type="tel"
            inputMode="tel"
            placeholder="07XX XXX XXX"
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls} htmlFor="br-make">
            Make *
          </label>
          <input
            id="br-make"
            required
            list="br-make-list"
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.make}
            onChange={(e) => setField("make", e.target.value)}
          />
          <datalist id="br-make-list">
            {BRANDS.map((b) => (
              <option key={b.name} value={b.make || b.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelCls} htmlFor="br-model">
            Model *
          </label>
          <input
            id="br-model"
            required
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.model}
            onChange={(e) => setField("model", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="br-variant">
            Variant / trim
          </label>
          <input
            id="br-variant"
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.variant}
            onChange={(e) => setField("variant", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelCls} htmlFor="br-year-min">
            Year from
          </label>
          <input
            id="br-year-min"
            type="number"
            min={1990}
            max={2030}
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.yearMin}
            onChange={(e) => setField("yearMin", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="br-year-max">
            Year to
          </label>
          <input
            id="br-year-max"
            type="number"
            min={1990}
            max={2030}
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.yearMax}
            onChange={(e) => setField("yearMax", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="br-budget-min">
            Budget min (KES)
          </label>
          <input
            id="br-budget-min"
            type="number"
            min={0}
            step={50000}
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.budgetMin}
            onChange={(e) => setField("budgetMin", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="br-budget-max">
            Budget max (KES) *
          </label>
          <input
            id="br-budget-max"
            required
            type="number"
            min={100000}
            step={50000}
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.budgetMax}
            onChange={(e) => setField("budgetMax", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className={labelCls} htmlFor="br-body">
            Body type
          </label>
          <select
            id="br-body"
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.bodyType}
            onChange={(e) => setField("bodyType", e.target.value)}
          >
            <option value="">Any</option>
            {BODY_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="br-fuel">
            Fuel
          </label>
          <select
            id="br-fuel"
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.fuelType}
            onChange={(e) => setField("fuelType", e.target.value)}
          >
            <option value="">Any</option>
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="br-trans">
            Transmission
          </label>
          <select
            id="br-trans"
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.transmission}
            onChange={(e) => setField("transmission", e.target.value)}
          >
            <option value="">Any</option>
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
            <option value="CVT">CVT</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="br-county">
            County *
          </label>
          <select
            id="br-county"
            required
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.county}
            onChange={(e) => setField("county", e.target.value)}
          >
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls} htmlFor="br-mileage-min">
            Max mileage from (km)
          </label>
          <input
            id="br-mileage-min"
            type="number"
            min={0}
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.mileageMin}
            onChange={(e) => setField("mileageMin", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="br-mileage-max">
            Max mileage to (km)
          </label>
          <input
            id="br-mileage-max"
            type="number"
            min={0}
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.mileageMax}
            onChange={(e) => setField("mileageMax", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="br-timeline">
            When do you need it?
          </label>
          <select
            id="br-timeline"
            className={inputCls}
            style={{ borderRadius: "var(--radius)" }}
            value={form.timeline}
            onChange={(e) => setField("timeline", e.target.value)}
          >
            {BUYER_REQUEST_TIMELINES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="br-condition">
          Stock preference
        </label>
        <select
          id="br-condition"
          className={inputCls}
          style={{ borderRadius: "var(--radius)" }}
          value={form.conditionPref}
          onChange={(e) => setField("conditionPref", e.target.value)}
        >
          {BUYER_REQUEST_CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className={labelCls}>Nice-to-have features</p>
        <div className="flex flex-wrap gap-2">
          {BUYER_REQUEST_FEATURE_OPTIONS.map((feature) => {
            const active = form.features.includes(feature);
            return (
              <button
                key={feature}
                type="button"
                onClick={() => toggleFeature(feature)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border transition-colors ${
                  active
                    ? "bg-[#38A169] border-[#38A169] text-white"
                    : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300"
                }`}
                style={{ borderRadius: "999px" }}
              >
                {feature}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="br-notes">
          Anything else?
        </label>
        <textarea
          id="br-notes"
          rows={3}
          maxLength={300}
          className={`${inputCls} resize-y min-h-[88px]`}
          style={{ borderRadius: "var(--radius)" }}
          placeholder="Colour preference, must-haves, financing, etc."
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={form.consentWhatsapp}
          onChange={(e) => setField("consentWhatsapp", e.target.checked)}
        />
        I agree to be contacted on WhatsApp by verified sellers through Welsh Motorhub. My number is not
        shown publicly on the request board.
      </label>

      {error ? (
        <p className="text-sm font-semibold text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#38A169] hover:bg-[#2F855A] disabled:opacity-60 text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest transition-colors"
        style={{ borderRadius: "var(--radius)" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            Submit request <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
