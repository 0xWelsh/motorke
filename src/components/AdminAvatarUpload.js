"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

export default function AdminAvatarUpload({ currentUrl, targetId, targetType, name, size = "lg" }) {
  const [imageUrl, setImageUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const sizeMap = {
    sm: "w-10 h-10 text-sm rounded-2xl",
    md: "w-14 h-14 text-lg rounded-2xl",
    lg: "w-24 h-24 text-3xl rounded-[2rem]",
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
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
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed — check your connection");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType }),
      });
      const data = await res.json();
      if (res.ok) {
        setImageUrl("");
      } else {
        setError(data.error || "Failed to remove photo");
      }
    } catch {
      setError("Failed to remove photo");
    }
  };

  const initial = name?.[0]?.toUpperCase() || "?";

  return (
    <div className="flex flex-col items-start gap-2">
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
            className={`${sizeMap[size]} object-cover border-2 border-white/[0.06] group-hover:border-accent-glow transition-all`}
          />
        ) : (
          <div className={`${sizeMap[size]} bg-[#1c1c1c] border-2 border-white/[0.06] group-hover:border-accent-glow text-white flex items-center justify-center font-black transition-all rounded-xl`}>
            {initial}
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ borderRadius: "inherit" }}>
          {uploading ? (
            <Loader2 size={size === "lg" ? 24 : 14} className="animate-spin text-white" />
          ) : (
            <Camera size={size === "lg" ? 24 : 14} className="text-white" />
          )}
        </div>
      </div>

      {imageUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
        >
          Remove photo
        </button>
      )}

      {error && (
        <p className="text-[10px] font-semibold text-red-500">{error}</p>
      )}
    </div>
  );
}
