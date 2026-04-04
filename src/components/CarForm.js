// src/components/CarForm.js
// Shared form used by admin (/admin/cars/new + edit) and dealer portal (/portal/cars/new + edit)
// Image upload is handled client-side via the /api/upload endpoint

"use client";

import { useState } from "react";
import { Plus, Check, Info } from "lucide-react";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, DRIVETRAIN_LABELS, BADGE_OPTIONS } from "@/lib/utils";

const MAKES = [
  "Toyota", "Subaru", "Mazda", "Nissan", "Mitsubishi", "Honda", "Isuzu", 
  "Suzuki", "Hino", "Fuso", "Isuzu Truck", "Tata", "Mercedes-Benz", 
  "BMW", "Audi", "Volkswagen", "Land Rover", "Range Rover", "Lexus", 
  "Jeep", "Ford", "Chevrolet", "Hyundai", "Kia", "Peugeot", "Renault", 
  "Volvo", "Scania", "MAN", "Beiben", "Sinotruk", "Other"
];

const CONDITIONS = ["Foreign Used", "Locally Used", "Brand New"];

export default function CarForm({ dealers = [], car = null, action, method = "POST" }) {
  const isEdit = !!car;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  const [uploading, setUploading]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [images, setImages]         = useState(
    car?.images?.map((img) => ({ url: img.url, isPrimary: img.isPrimary })) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [badges, setBadges]         = useState(car?.badges || []);

  // Handle image file selection → upload to Supabase via API (parallel)
  async function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError("");
    setUploadProgress({ done: 0, total: files.length });

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res  = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || `Failed: ${file.name}`);

        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        return data.url;
      })
    );

    const urls = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const failures = results
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason.message);

    setImages((prev) => {
      const newImages = urls.map((url, i) => ({
        url,
        isPrimary: prev.length === 0 && i === 0,
      }));
      return [...prev, ...newImages];
    });

    if (failures.length > 0) {
      setError(`${failures.length} upload(s) failed: ${failures.join(", ")}`);
    }

    setUploading(false);
    setUploadProgress({ done: 0, total: 0 });
  }

  function setPrimary(idx) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  }

  function removeImage(idx) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx].isPrimary && next.length > 0) next[0].isPrimary = true;
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    data.features = (data.features || "")
      .split(",").map((f) => f.trim()).filter(Boolean);

    data.images   = images;
    data.year      = parseInt(data.year);
    data.price     = parseInt(data.price);
    data.mileage   = data.mileage ? parseInt(data.mileage) : null;
    data.engineCC  = data.engineCC ? parseInt(data.engineCC) : null;
    data.cylinders = data.cylinders ? parseInt(data.cylinders) : null;
    data.horsepower= data.horsepower ? parseInt(data.horsepower) : null;
    data.torque    = data.torque ? parseInt(data.torque) : null;
    data.airbags   = data.airbags ? parseInt(data.airbags) : null;
    data.seats     = data.seats ? parseInt(data.seats) : null;
    
    data.negotiable = data.negotiable === "on";
    data.dutyPaid   = data.dutyPaid   === "on";
    data.imported   = data.imported   === "on";
    data.featured   = data.featured   === "on";
    data.turbo      = data.turbo      === "on";
    data.sunroof    = data.sunroof    === "on";
    data.badges     = badges;

    try {
      const res = await fetch(action, {
        method: method === "PUT" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");

      window.location.href = result.redirectTo || "/admin/cars";
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const inputCls = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-black placeholder:text-white outline-none focus:border-[var(--brand)] transition-all shadow-sm";
  const selectCls = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-black outline-none focus:border-[var(--brand)] transition-all shadow-sm appearance-none";
  const labelCls = "block text-[10px] font-black uppercase tracking-[0.2em] text-white ml-1 mb-2.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in duration-700">

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-black text-[11px] font-black uppercase tracking-widest rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
          <Info size={16} />
          {error}
        </div>
      )}

      {/* ── Dealership ── */}
      {dealers.length > 1 && (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
          <label className={labelCls}>Assigned Dealership *</label>
          <div className="relative">
            <select name="dealerId" defaultValue={car?.dealerId || ""} required className={selectCls}>
              <option value="">Select Showroom Territory</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.location}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {dealers.length === 1 && (
        <input type="hidden" name="dealerId" value={dealers[0].id} />
      )}

      {/* ── Identity ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
           <h3 className="text-lg font-black text-black tracking-tight">Core Vehicle Identity</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className={labelCls}>Manufacturer Spec *</label>
            <input name="make" list="makes-list" required defaultValue={car?.make || ""}
              placeholder="e.g. Toyota" className={inputCls} />
            <datalist id="makes-list">
              {MAKES.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <label className={labelCls}>Model Group *</label>
            <input name="model" required defaultValue={car?.model || ""}
              placeholder="e.g. Hilux" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Model Variant</label>
            <input name="variant" defaultValue={car?.variant || ""}
              placeholder="e.g. Double Cab 4x4" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Logistics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
          <label className={labelCls}>Model Year *</label>
          <select name="year" defaultValue={car?.year || currentYear} required className={selectCls}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm border-b-4 border-b-emerald-500">
          <label className={labelCls}>Showroom Price (KES) *</label>
          <input name="price" type="number" required defaultValue={car?.price || ""}
            placeholder="e.g. 2,500,000" className={`${inputCls} text-black`} />
        </div>
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
          <label className={labelCls}>Distance Travelled (km)</label>
          <input name="mileage" type="number" defaultValue={car?.mileage || ""}
            placeholder="e.g. 45,000" className={inputCls} />
        </div>
      </div>

      {/* ── Engine & Performance ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
           <h3 className="text-lg font-black text-black tracking-tight">Technical Architecture</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <label className={labelCls}>Displacement (cc)</label>
            <input name="engineCC" type="number" defaultValue={car?.engineCC || ""}
              placeholder="2000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cylinder Count</label>
            <input name="cylinders" type="number" defaultValue={car?.cylinders || ""}
              placeholder="4" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Output (HP)</label>
            <input name="horsepower" type="number" defaultValue={car?.horsepower || ""}
              placeholder="180" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Peak Torque (Nm)</label>
            <input name="torque" type="number" defaultValue={car?.torque || ""}
              placeholder="250" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Energy Source *</label>
            <select name="fuelType" defaultValue={car?.fuelType || "PETROL"} required className={selectCls}>
              {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Drive Logic *</label>
            <select name="transmission" defaultValue={car?.transmission || "AUTOMATIC"} required className={selectCls}>
              {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center pt-8">
             <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" name="turbo" defaultChecked={car?.turbo ?? false}
                className="w-5 h-5 accent-emerald-500 rounded-lg transition-all" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-black transition-colors">Induction: Turbo</span>
            </label>
          </div>
        </div>
      </div>

       {/* ── Features & Description ── */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <label className={labelCls}>Interior Excellence & Key Systems <span className="normal-case text-white font-bold ml-2">(Comma Separated)</span></label>
            <textarea name="features" rows={4}
              defaultValue={car?.features?.join(", ") || ""}
              placeholder="e.g. Sunroof, Leather Trim, Reverse Camera, Apple CarPlay"
              className={`${inputCls} resize-none py-6`} />
          </div>
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <label className={labelCls}>Listing Description</label>
            <textarea name="description" rows={4}
              defaultValue={car?.description || ""}
              placeholder="Provide history, condition, and any unique selling points..."
              className={`${inputCls} resize-none py-6`} />
          </div>
       </div>

      {/* ── Image Upload ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             <h3 className="text-lg font-black text-black tracking-tight">Showroom Visuals</h3>
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Min. 3 High RES Photos Preferred</p>
        </div>

        <label className={`group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-100 hover:border-emerald-200 rounded-[2rem] p-16 cursor-pointer transition-all duration-500 bg-slate-50/20 hover:bg-emerald-50/10 mb-8 ${uploading ? "pointer-events-none opacity-50" : ""}`}>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={uploading} />
          
          {uploading ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-sm font-black text-black tracking-tight uppercase">Synchronizing Assets</p>
              <p className="text-[10px] font-bold text-white mt-2">Item {uploadProgress.done} of {uploadProgress.total}</p>
            </div>
          ) : (
            <div className="text-center group-hover:scale-105 transition-transform duration-500">
              <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-xl transition-all">
                 <Plus className="text-white group-hover:text-black" size={32} />
              </div>
              <p className="text-sm font-black text-black uppercase tracking-widest">Deploy Photos</p>
              <p className="text-[10px] font-bold text-white mt-2 leading-relaxed">Drag assets or click to browse. WEBP/JPG/PNG supported.</p>
            </div>
          )}
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className={`group/img relative rounded-[1.5rem] overflow-hidden border-2 transition-all duration-500 ${
                img.isPrimary ? "border-emerald-500 shadow-xl" : "border-slate-50 shadow-sm hover:border-slate-200"
              }`}>
                <img src={img.url} alt="" className="w-full aspect-square object-cover transition-transform duration-700 group-hover/img:scale-110" />
                
                {img.isPrimary && (
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Asset Primary
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                  {!img.isPrimary && (
                    <button type="button" onClick={() => setPrimary(idx)}
                      className="w-full bg-white hover:bg-emerald-50 text-black text-[9px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-xl active:scale-95">
                      Main Hub
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(idx)}
                    className="w-full bg-rose-500/90 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95">
                    Purge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Badges ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
        <label className={labelCls}>Marketplace Badges <span className="normal-case text-white font-bold ml-2">(Click to Toggle)</span></label>
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(BADGE_OPTIONS).map(([name, { color }]) => {
            const active = badges.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setBadges((prev) =>
                  active ? prev.filter((b) => b !== name) : [...prev, name]
                )}
                className={`text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  active
                    ? `bg-emerald-500 border-emerald-500 text-white shadow-lg`
                    : "bg-slate-50 border-slate-50 text-white hover:border-slate-200"
                }`}
              >
                {active && <Check size={10} className="inline-block mr-2" />}
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status Flags ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
           <h3 className="text-lg font-black text-black tracking-tight">Publicity Flags</h3>
        </div>
        
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          {[
            { name: "negotiable", label: "Accepting Offers", defaultChecked: car?.negotiable ?? true },
            { name: "dutyPaid",   label: "Customs Duty Paid", defaultChecked: car?.dutyPaid ?? true },
            { name: "imported",   label: "Import Origin Docs", defaultChecked: car?.imported ?? true },
            { name: "featured",   label: "Premium Spotlight", defaultChecked: car?.featured ?? false },
          ].map(({ name, label, defaultChecked }) => (
            <label key={name} className="flex items-center gap-4 cursor-pointer group">
              <input type="checkbox" name={name} defaultChecked={defaultChecked}
                className="w-6 h-6 accent-emerald-500 rounded-lg transition-all" />
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white group-hover:text-black transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 pt-10">
        <button type="submit" disabled={submitting || uploading}
          className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-white font-black py-7 rounded-[2.5rem] text-sm uppercase tracking-[0.25em] transition-all shadow-2xl shadow-slate-900/10 active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-3">
          {submitting ? "Processing Asset..." : isEdit ? "Update Showroom Entry" : "Deploy to Marketplace"}
          {!submitting && <Check size={20} />}
        </button>
        <a href="/portal" className="sm:w-56 bg-slate-50 hover:bg-slate-100 text-white hover:text-black font-black py-7 rounded-[2.5rem] text-[10px] uppercase tracking-[0.25em] transition-all flex items-center justify-center shadow-sm">
          Discard Changes
        </a>
      </div>
    </form>
  );
}
