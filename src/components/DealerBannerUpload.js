"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Image as ImageIcon } from "lucide-react";

export default function DealerBannerUpload({ currentUrl, dealerName }) {
  const [bannerUrl, setBannerUrl] = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("banner", file);

    try {
      const res = await fetch("/api/portal/banner", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.bannerUrl) {
        setBannerUrl(`${data.bannerUrl}?t=${Date.now()}`);
      }
    } catch (error) {
      console.error("Dealer banner upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="relative group cursor-pointer rounded-none overflow-hidden border border-[#ddd4c8] bg-[#fbfcfe]"
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />

      <div className="aspect-[21/8] w-full">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${dealerName} banner`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400 bg-gradient-to-r from-slate-100 to-slate-50">
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
              <ImageIcon className="w-4 h-4" />
              Add Banner Photo
            </span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-slate-900" />
        ) : (
          <span className="inline-flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-[0.14em]">
            <Camera size={16} />
            Change Banner
          </span>
        )}
      </div>
    </div>
  );
}
