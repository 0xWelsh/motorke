// src/components/CarForm.js
// Shared form used by admin (/admin/cars/new + edit) and dealer portal (/portal/cars/new + edit)
// Image upload is handled client-side via the /api/upload endpoint

"use client";

import { useState } from "react";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/utils";

const MAKES = ["Toyota","Subaru","Mazda","Mitsubishi","Nissan","Honda","Isuzu","Land Rover","Mercedes-Benz","BMW","Volkswagen","Hyundai","Kia","Suzuki","Other"];
const DRIVE_TYPES = ["RHD","LHD","AWD","FWD","RWD","FOURWD"];

export default function CarForm({ dealers = [], car = null, action, method = "POST" }) {
  const isEdit = !!car;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

  const [uploading, setUploading]   = useState(false);
  const [images, setImages]         = useState(
    car?.images?.map((img) => ({ url: img.url, isPrimary: img.isPrimary })) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  // Handle image file selection → upload to Supabase via API
  async function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res  = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Upload failed");

        setImages((prev) => [
          ...prev,
          { url: data.url, isPrimary: prev.length === 0 },
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function setPrimary(idx) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  }

  function removeImage(idx) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // If we removed the primary, make first image primary
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

    // Parse features
    data.features = (data.features || "")
      .split(",").map((f) => f.trim()).filter(Boolean);

    // Attach images
    data.images   = images;
    data.year      = parseInt(data.year);
    data.price     = parseInt(data.price);
    data.mileage   = data.mileage ? parseInt(data.mileage) : null;
    data.engineCC  = data.engineCC ? parseInt(data.engineCC) : null;
    data.seats     = data.seats ? parseInt(data.seats) : null;
    data.negotiable = data.negotiable === "on";
    data.dutyPaid   = data.dutyPaid   === "on";
    data.imported   = data.imported   === "on";
    data.featured   = data.featured   === "on";

    try {
      const res = await fetch(action, {
        method: method === "PUT" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");

      // Redirect to the car page or admin cars list
      window.location.href = result.redirectTo || "/admin/cars";
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";
  const selectCls = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50 transition-colors";
  const labelCls = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Dealership (admin only — hidden if only 1 dealer) ── */}
      {dealers.length > 1 && (
        <div>
          <label className={labelCls}>Dealership *</label>
          <select name="dealerId" defaultValue={car?.dealerId || ""} required className={selectCls}>
            <option value="">Select dealership</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {d.location}</option>
            ))}
          </select>
        </div>
      )}
      {dealers.length === 1 && (
        <input type="hidden" name="dealerId" value={dealers[0].id} />
      )}

      {/* ── Identity ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Make *</label>
          <input name="make" list="makes-list" required defaultValue={car?.make || ""}
            placeholder="Toyota" className={inputCls} />
          <datalist id="makes-list">
            {MAKES.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Model *</label>
          <input name="model" required defaultValue={car?.model || ""}
            placeholder="Hilux" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Variant</label>
          <input name="variant" defaultValue={car?.variant || ""}
            placeholder="Double Cab 4x4" className={inputCls} />
        </div>
      </div>

      {/* ── Year / Price / Mileage ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Year *</label>
          <select name="year" defaultValue={car?.year || currentYear} required className={selectCls}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Price (KES) *</label>
          <input name="price" type="number" required defaultValue={car?.price || ""}
            placeholder="2500000" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Mileage (km)</label>
          <input name="mileage" type="number" defaultValue={car?.mileage || ""}
            placeholder="45000" className={inputCls} />
        </div>
      </div>

      {/* ── Fuel / Transmission / Body ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Fuel type *</label>
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
        <div>
          <label className={labelCls}>Body type *</label>
          <select name="bodyType" defaultValue={car?.bodyType || "SEDAN"} required className={selectCls}>
            {Object.entries(BODY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* ── Engine / Drive / Colour / Seats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Engine (cc)</label>
          <input name="engineCC" type="number" defaultValue={car?.engineCC || ""}
            placeholder="2000" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Drive type</label>
          <select name="driveType" defaultValue={car?.driveType || "RHD"} className={selectCls}>
            {DRIVE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Colour</label>
          <input name="color" defaultValue={car?.color || ""}
            placeholder="Pearl White" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Seats</label>
          <input name="seats" type="number" min="1" max="60" defaultValue={car?.seats || "5"}
            className={inputCls} />
        </div>
      </div>

      {/* ── Features ── */}
      <div>
        <label className={labelCls}>
          Features <span className="normal-case text-white/20">(comma-separated)</span>
        </label>
        <input name="features"
          defaultValue={car?.features?.join(", ") || ""}
          placeholder="Sunroof, Leather seats, Reverse camera, Apple CarPlay"
          className={inputCls} />
      </div>

      {/* ── Description ── */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea name="description" rows={4} defaultValue={car?.description || ""}
          placeholder="Describe the car — history, condition, any extras included..."
          className={`${inputCls} resize-none`} />
      </div>

      {/* ── Images ── */}
      <div>
        <label className={labelCls}>Photos</label>

        {/* Upload area */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-[#f97316]/30 rounded-2xl p-8 cursor-pointer transition-colors mb-4">
          <input type="file" accept="image/*" multiple onChange={handleImageChange}
            className="hidden" disabled={uploading} />
          {uploading ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-white/40">Uploading…</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-white/50">Click to upload photos</p>
              <p className="text-xs text-white/20 mt-1">JPG, PNG, WEBP · Multiple allowed</p>
            </div>
          )}
        </label>

        {/* Uploaded images preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
                img.isPrimary ? "border-[#f97316]" : "border-white/10"
              }`}>
                <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                  {!img.isPrimary && (
                    <button type="button" onClick={() => setPrimary(idx)}
                      className="text-[10px] bg-[#f97316] text-white px-2 py-0.5 rounded-full w-full text-center">
                      Set primary
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(idx)}
                    className="text-[10px] bg-red-500/80 text-white px-2 py-0.5 rounded-full w-full text-center">
                    Remove
                  </button>
                </div>
                {img.isPrimary && (
                  <span className="absolute top-1 left-1 text-[9px] bg-[#f97316] text-white px-1.5 py-0.5 rounded-full font-bold">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Flags ── */}
      <div className="flex flex-wrap gap-6">
        {[
          { name: "negotiable", label: "Price negotiable",    defaultChecked: car?.negotiable ?? true  },
          { name: "dutyPaid",   label: "Duty fully paid",     defaultChecked: car?.dutyPaid   ?? true  },
          { name: "imported",   label: "Imported from Japan", defaultChecked: car?.imported   ?? true  },
          { name: "featured",   label: "Featured listing",    defaultChecked: car?.featured   ?? false },
        ].map(({ name, label, defaultChecked }) => (
          <label key={name} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name={name} defaultChecked={defaultChecked}
              className="w-4 h-4 accent-[#f97316]" />
            <span className="text-sm text-white/60">{label}</span>
          </label>
        ))}
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full bg-[#f97316] hover:bg-[#ea6c0b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-colors text-base"
      >
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Publish listing →"}
      </button>
    </form>
  );
}
