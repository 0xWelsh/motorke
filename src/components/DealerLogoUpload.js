"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

export default function DealerLogoUpload({ currentUrl, dealerName, size = "xl" }) {
  const [logoUrl, setLogoUrl] = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const sizeMap = {
    md: "w-16 h-16 rounded-2xl text-2xl",
    lg: "w-20 h-20 rounded-2xl text-3xl",
    xl: "w-28 h-28 rounded-3xl text-4xl",
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch("/api/portal/logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.logoUrl) {
        setLogoUrl(`${data.logoUrl}?t=${Date.now()}`);
      }
    } catch (error) {
      console.error("Dealer logo upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />

      {logoUrl ? (
        <img
          src={logoUrl}
          alt={dealerName}
          className={`${sizeMap[size]} object-cover border-4 border-white shadow-xl shadow-slate-900/5`}
        />
      ) : (
        <div className={`${sizeMap[size]} bg-[#faf7f2] border-4 border-white text-slate-900 flex items-center justify-center font-black shadow-xl shadow-slate-900/5`}>
          {dealerName?.[0]?.toUpperCase() || "D"}
        </div>
      )}

      <div
        className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        style={{ borderRadius: "inherit" }}
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-white" />
        ) : (
          <Camera size={18} className="text-white" />
        )}
      </div>
    </div>
  );
}
