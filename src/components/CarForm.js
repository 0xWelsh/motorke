// src/components/CarForm.js
// Shared form used by admin (/admin/cars/new + edit) and dealer portal (/portal/cars/new + edit)
// Image upload is handled client-side via the /api/upload endpoint

"use client";

import { useState, useCallback } from "react";
import { Plus, Check, Info } from "lucide-react";
import MediaUploader from "./admin/MediaUploader";
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
  async function handleFilesSelected(newFiles) {
    // newFiles from MediaUploader are File objects
    // Find files that don't have a URL yet
    const toUpload = newFiles.filter(f => !f.url);
    if (!toUpload.length) {
       // Just order or primary changed
       setImages(newFiles.map(f => ({ url: f.url || f.preview, isPrimary: f.isPrimary })));
       return;
    }

    setUploading(true);
    setError("");
    setUploadProgress({ done: 0, total: toUpload.length });

    const results = await Promise.allSettled(
      toUpload.map(async (file) => {
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

  const inputCls = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all shadow-sm";
  const selectCls = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all shadow-sm appearance-none";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1 mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in duration-700">

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black uppercase tracking-widest rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
          <Info size={16} />
          {error}
        </div>
      )}

      {/* ── Dealership ── */}
      {dealers.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <label className={labelCls}>Assigned Dealership *</label>
          <div className="relative">
            <select name="dealerId" defaultValue={car?.dealerId || ""} required className={selectCls}>
              <option value="">Select Dealership</option>
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
           <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Vehicle Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelCls}>Make *</label>
            <input name="make" list="makes-list" required defaultValue={car?.make || ""}
              placeholder="e.g. Toyota" className={inputCls} />
            <datalist id="makes-list">
              {MAKES.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <label className={labelCls}>Model *</label>
            <input name="model" required defaultValue={car?.model || ""}
              placeholder="e.g. Hilux" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Variant / Trim</label>
            <input name="variant" defaultValue={car?.variant || ""}
              placeholder="e.g. Double Cab 4x4" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Logistics & Basics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <label className={labelCls}>Year *</label>
          <select name="year" defaultValue={car?.year || currentYear} required className={selectCls}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-8 shadow-sm border-b-4 border-b-emerald-500/50">
          <label className={labelCls}>Price (KES) *</label>
          <input name="price" type="number" required defaultValue={car?.price || ""}
            placeholder="e.g. 2500000" className={`${inputCls} text-emerald-600 dark:text-emerald-400`} />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <label className={labelCls}>Mileage (km)</label>
          <input name="mileage" type="number" defaultValue={car?.mileage || ""}
            placeholder="e.g. 45000" className={inputCls} />
        </div>
      </div>

      {/* ── Engine & Performance ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
           <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Engine & Details</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className={labelCls}>Engine Size (cc)</label>
            <input name="engineCC" type="number" defaultValue={car?.engineCC || ""}
              placeholder="e.g. 2000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cylinders</label>
            <input name="cylinders" type="number" defaultValue={car?.cylinders || ""}
              placeholder="e.g. 4" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Horsepower</label>
            <input name="horsepower" type="number" defaultValue={car?.horsepower || ""}
              placeholder="e.g. 180" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Torque (Nm)</label>
            <input name="torque" type="number" defaultValue={car?.torque || ""}
              placeholder="e.g. 250" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fuel Type *</label>
            <select name="fuelType" defaultValue={car?.fuelType || "PETROL"} required className={selectCls}>
              {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Transmission *</label>
            <select name="transmission" defaultValue={car?.transmission || "AUTOMATIC"} required className={selectCls}>
              {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center pt-8">
             <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" name="turbo" defaultChecked={car?.turbo ?? false}
                className="w-5 h-5 accent-emerald-500 rounded-lg transition-all" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Has Turbo</span>
            </label>
          </div>
        </div>
      </div>

       {/* ── Features & Description ── */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <label className={labelCls}>Features (Comma Separated)</label>
            <textarea name="features" rows={4}
              defaultValue={car?.features?.join(", ") || ""}
              placeholder="e.g. Sunroof, Leather Trim, Reverse Camera"
              className={`${inputCls} resize-none py-6`} />
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <label className={labelCls}>Listing Description</label>
            <textarea name="description" rows={4}
              defaultValue={car?.description || ""}
              placeholder="Provide history, condition, and any unique points..."
              className={`${inputCls} resize-none py-6`} />
          </div>
       </div>

      {/* ── Image Upload ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Photos</h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Min. 3 Photos Recommended</p>
        </div>

        {uploading && (
          <div className="text-center mb-8 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Uploading Images...</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2">Image {uploadProgress.done} of {uploadProgress.total}</p>
          </div>
        )}

        <div className={uploading ? "opacity-50 pointer-events-none" : ""}>
          <MediaUploader 
             initialImages={images} 
             onFilesSelected={handleFilesSelected} 
             maxFiles={15} 
          />
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <label className={labelCls}>Tags <span className="normal-case text-slate-400 font-bold ml-2">(Click to Toggle)</span></label>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(BADGE_OPTIONS).map(([name, { color }]) => {
            const active = badges.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setBadges((prev) =>
                  active ? prev.filter((b) => b !== name) : [...prev, name]
                )}
                className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg border-2 transition-all active:scale-95 ${
                  active
                    ? `bg-emerald-500 border-emerald-500 text-white shadow-md`
                    : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                {active && <Check size={10} className="inline-block mr-1.5" />}
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status Flags ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
           <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Additional Options</h3>
        </div>
        
        <div className="flex flex-wrap gap-x-10 gap-y-5">
          {[
            { name: "negotiable", label: "Accepting Offers", defaultChecked: car?.negotiable ?? true },
            { name: "dutyPaid",   label: "Duty Paid", defaultChecked: car?.dutyPaid ?? true },
            { name: "imported",   label: "Imported", defaultChecked: car?.imported ?? true },
            { name: "featured",   label: "Featured Listing", defaultChecked: car?.featured ?? false },
          ].map(({ name, label, defaultChecked }) => (
            <label key={name} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" name={name} defaultChecked={defaultChecked}
                className="w-5 h-5 accent-emerald-500 rounded-md transition-all" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <a href="/portal" className="px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center">
          Cancel
        </a>
        <button type="submit" disabled={submitting || uploading}
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Listing"}
          {!submitting && <Check size={16} />}
        </button>
      </div>
    </form>
  );
}
