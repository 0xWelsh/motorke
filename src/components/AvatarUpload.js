"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

export default function AvatarUpload({ currentUrl, userName, size = "lg" }) {
  const [avatarUrl, setAvatarUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const sizeMap = {
    sm: "w-10 h-10 text-sm rounded-xl",
    md: "w-14 h-14 text-lg rounded-2xl",
    lg: "w-24 h-24 text-3xl rounded-[2rem]",
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
      if (data.success) {
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
          className={`${sizeMap[size]} object-cover border-2 border-white/10 group-hover:border-orange-500/50 transition-all`}
        />
      ) : (
        <div className={`${sizeMap[size]} bg-white/10 border-2 border-white/10 group-hover:border-orange-500/50 text-white/40 group-hover:text-white flex items-center justify-center font-black transition-all`}>
          {initial}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ borderRadius: "inherit" }}>
        {uploading ? (
          <Loader2 size={size === "lg" ? 24 : 14} className="animate-spin text-white" />
        ) : (
          <Camera size={size === "lg" ? 24 : 14} className="text-white" />
        )}
      </div>
    </div>
  );
}
