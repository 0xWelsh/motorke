"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, AlertTriangle } from "lucide-react";

const inputCls =
  "w-full bg-surface-hover border border-border focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow rounded-2xl py-2.5 px-4 text-sm font-medium text-text outline-none transition-colors placeholder:text-dim";
const labelCls = "text-xs font-bold uppercase tracking-wider text-muted mb-1.5 block";

const MAX_DIM = 1600;
const QUALITY = 0.82;

/**
 * Resize + re-encode in the browser before upload. A 3-5MB iPhone JPEG
 * becomes ~150-350KB; uploads that used to take minutes on mobile data
 * now take seconds. Also normalizes EXIF orientation (from-image) so
 * rotated shots land upright, and turns anything decodable into JPEG.
 */
async function compressToJpeg(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error("encode failed");
  return { blob, width: canvas.width, height: canvas.height };
}

export default function SellCarForm() {
  const router = useRouter();
  // [{ id, preview, blob, status: ready|uploading|done|error, error }]
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const idRef = useRef(0);

  async function addFiles(list) {
    const incoming = Array.from(list || []);
    setError("");
    for (const file of incoming) {
      if (photos.length >= 8) break;
      const id = ++idRef.current;
      setPhotos((prev) => [...prev, { id, preview: URL.createObjectURL(file), blob: null, status: "ready" }].slice(0, 8));
      try {
        const { blob } = await compressToJpeg(file);
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, blob } : p)));
      } catch {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        setError("Couldn't read one of those images. Try a photo instead of a RAW/HEIC file.");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const removePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (photos.length === 0) { setError("Add at least one photo."); return; }

    setBusy(true);
    try {
      // 1) Upload photos one request at a time (small, retryable, iOS-safe).
      const urls = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgress(`Uploading photo ${i + 1} of ${photos.length}…`);
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "uploading" } : p)));
        const fd = new FormData();
        fd.append("photo", new File([photo.blob], `photo-${i + 1}.jpg`, { type: "image/jpeg" }));
        const res = await fetch("/api/my-cars/photo", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "error" } : p)));
          setError(data.error || `Photo ${i + 1} failed to upload — check your connection and submit again.`);
          return;
        }
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "done" } : p)));
        urls.push(data.url);
      }

      // 2) Commit the listing with the returned URLs.
      setProgress("Submitting listing…");
      const form = new FormData(e.target);
      const fields = Object.fromEntries([...form.entries()]);
      const res = await fetch("/api/my-cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, photos: urls }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/seller?created=1");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Network error — try again. Photos already uploaded won't be re-sent twice on retry.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Photos */}
      <div>
        <label className={labelCls}>Photos * (up to 8 — first one is the cover)</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface-overlay">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                disabled={busy}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-black uppercase tracking-widest bg-[var(--accent)] text-black px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              {p.status === "uploading" && (
                <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
                  Sending…
                </span>
              )}
              {p.status === "done" && (
                <span className="absolute inset-x-0 bottom-0 bg-[var(--accent)] text-black text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
                  Sent
                </span>
              )}
              {p.status === "error" && (
                <span className="absolute inset-x-0 bottom-0 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
                  Failed
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
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <p className="mt-2 text-[11px] text-muted">
          Photos are shrunk on your phone before uploading — this works on mobile data.
        </p>
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

      {error && (
        <p className="flex items-center gap-2 text-xs font-bold text-rose-400">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary btn-sm w-full sm:w-auto">
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> {progress || "Submitting…"}
          </span>
        ) : (
          "Submit for review"
        )}
      </button>
      <p className="text-[11px] text-muted">
        A human on our team reviews every private listing before it goes live. Reviews usually take a day.
      </p>
    </form>
  );
}
