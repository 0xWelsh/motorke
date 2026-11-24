"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

const inputCls =
  "w-full bg-surface-hover border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow rounded-2xl py-2.5 px-4 text-sm font-medium text-text outline-none transition-colors placeholder:text-dim";
const labelCls = "text-xs font-bold uppercase tracking-wider text-muted mb-1.5 block";

export default function SellCarForm() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function addFiles(list) {
    const incoming = Array.from(list || []).slice(0, 8 - photos.length);
    setPhotos((prev) => [...prev, ...incoming].slice(0, 8));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (photos.length === 0) { setError("Add at least one photo."); return; }
    setBusy(true);
    try {
      const fd = new FormData(e.target);
      photos.forEach((p) => fd.append("photos", p));
      const res = await fetch("/api/my-cars", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) router.push("/seller?created=1");
      else setError(data.error || "Something went wrong.");
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Photos */}
      <div>
        <label className={labelCls}>Photos * (up to 8 — first one is the cover)</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-black uppercase tracking-widest bg-[var(--accent)] text-black px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
          {photos.length < 8 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:border-[var(--accent-dim)] hover:text-secondary transition-colors"
            >
              <Upload size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className={labelCls}>Make *</label><input name="make" required maxLength={40} className={inputCls} placeholder="Toyota" /></div>
        <div><label className={labelCls}>Model *</label><input name="model" required maxLength={60} className={inputCls} placeholder="Prado" /></div>
        <div><label className={labelCls}>Year *</label><input name="year" required inputMode="numeric" className={inputCls} placeholder="2017" /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className={labelCls}>Trim / variant</label><input name="variant" maxLength={60} className={inputCls} placeholder="TXL" /></div>
        <div><label className={labelCls}>Price KES *</label><input name="price" required inputMode="numeric" className={inputCls} placeholder="3,500,000" /></div>
        <div><label className={labelCls}>Mileage km</label><input name="mileage" inputMode="numeric" className={inputCls} placeholder="48,000" /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Fuel</label>
          <select name="fuelType" className={inputCls} defaultValue="PETROL">
            <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Gearbox</label>
          <select name="transmission" className={inputCls} defaultValue="AUTOMATIC">
            <option>Automatic</option><option>Manual</option><option>CVT</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Drive</label>
          <select name="drivetrain" className={inputCls} defaultValue="4WD">
            <option>FWD</option><option>RWD</option><option>AWD</option><option>4WD</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Body</label>
          <select name="bodyType" className={inputCls} defaultValue="SUV">
            <option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Coupe</option>
            <option>Pickup</option><option>Van</option><option>Wagon</option><option>Convertible</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Engine CC</label><input name="engineCC" inputMode="numeric" className={inputCls} placeholder="2755" /></div>
        <div><label className={labelCls}>Colour</label><input name="color" maxLength={30} className={inputCls} placeholder="Pearl white" /></div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea name="description" rows={5} maxLength={4000} className={`${inputCls} resize-none`} placeholder="History, condition, why you're selling. Be honest — it sells faster." />
      </div>

      <div>
        <label className={labelCls}>YouTube link (optional)</label>
        <input name="videoUrl" className={inputCls} placeholder="https://youtube.com/shorts/…" />
      </div>

      {error && <p className="text-xs font-bold text-rose-400">{error}</p>}

      <button type="submit" disabled={busy} className="btn btn-primary btn-sm w-full sm:w-auto">
        {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Submitting…</span> : "Submit for review"}
      </button>
      <p className="text-[11px] text-muted">
        A human on our team reviews every private listing before it goes live. Reviews usually take a day.
      </p>
    </form>
  );
}
