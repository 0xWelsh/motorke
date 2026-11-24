"use client";

import { useState, useRef } from "react";
import { ImageIcon, Loader2, X } from "lucide-react";

export default function BannerUpload({ currentUrl }) {
  const [url, setUrl] = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  async function upload(file) {
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("banner", file);
    try {
      const res = await fetch("/api/profile/banner", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setUrl(data.bannerUrl + "?t=" + Date.now());
      else setError(data.error || "Upload failed");
    } catch {
      setError("Upload failed — check your connection");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove() {
    setError("");
    const res = await fetch("/api/profile/banner", { method: "DELETE" }).catch(() => null);
    if (res?.ok) setUrl("");
    else setError("Failed to remove banner");
  }

  return (
    <div className="relative w-full aspect-[21/9] sm:aspect-[24/7] rounded-2xl overflow-hidden border border-border bg-surface-hover group">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Profile banner" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">
            Profile banner — wide image works best
          </p>
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 bg-black/40">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn btn-dark btn-sm"
        >
          <ImageIcon size={14} /> {url ? "Replace" : "Add banner"}
        </button>
        {url && (
          <button type="button" onClick={remove} className="btn btn-sm bg-white/10 text-white hover:bg-white/20 border border-white/20">
            <X size={14} />
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {error && <p className="absolute bottom-2 left-3 text-[11px] font-bold text-rose-400">{error}</p>}
    </div>
  );
}
