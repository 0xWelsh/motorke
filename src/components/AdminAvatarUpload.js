"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

export default function AdminAvatarUpload({ currentUrl, targetId, targetType, name, size = "lg" }) {
  const [imageUrl, setImageUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const sizeMap = {
    sm: "w-10 h-10 text-sm rounded-none",
    md: "w-14 h-14 text-lg rounded-none",
    lg: "w-24 h-24 text-3xl rounded-[2rem]",
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("targetId", targetId);
    formData.append("targetType", targetType);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.imageUrl + "?t=" + Date.now());
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const initial = name?.[0]?.toUpperCase() || "?";

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeMap[size]} object-cover border-2 border-[#ddd4c8] group-hover:border-#ff5a2f/50 transition-all`}
        />
      ) : (
        <div className={`${sizeMap[size]} bg-white border-2 border-[#ddd4c8] group-hover:border-#ff5a2f/50 text-slate-500 group-hover:text-slate-900 flex items-center justify-center font-black transition-all`}>
          {initial}
        </div>
      )}

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ borderRadius: "inherit" }}>
        {uploading ? (
          <Loader2 size={size === "lg" ? 24 : 14} className="animate-spin text-slate-900" />
        ) : (
          <Camera size={size === "lg" ? 24 : 14} className="text-slate-900" />
        )}
      </div>
    </div>
  );
}
