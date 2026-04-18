"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

export default function AvatarUpload({ currentUrl, userName, size = "lg" }) {
  const [avatarUrl, setAvatarUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const sizeMap = {
    sm: "w-10 h-10 text-sm rounded-2xl",
    md: "w-14 h-14 text-lg rounded-2xl",
    lg: "w-24 h-24 text-3xl rounded-[2rem]",
    xl: "w-32 h-32 text-4xl rounded-[2.5rem]",
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl + "?t=" + Date.now()); // cache bust
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const initial = userName?.[0]?.toUpperCase() || "?";

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />

      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName}
          className={`${sizeMap[size]} object-cover border-4 border-white shadow-xl shadow-emerald-900/5 group-hover:border-emerald-100 transition-all`}
        />
      ) : (
        <div className={`${sizeMap[size]} bg-emerald-50 border-4 border-white text-[#ff5a2f] flex items-center justify-center font-black shadow-xl shadow-emerald-900/5 group-hover:border-emerald-100 transition-all`}>
          {initial}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ borderRadius: "inherit" }}>
        {uploading ? (
          <Loader2 size={size === "lg" ? 24 : 14} className="animate-spin text-slate-900 dark:text-white" />
        ) : (
          <Camera size={size === "lg" ? 24 : 14} className="text-slate-900 dark:text-white" />
        )}
      </div>
    </div>
  );
}
