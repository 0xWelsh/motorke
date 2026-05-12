"use client";

// src/components/SafeImage.js
// Thin wrapper around next/image that handles broken / unreachable URLs
// gracefully. Without this, a failed image (404, blocked optimizer, dead
// CDN, etc.) shows the browser's broken-image icon — which is what users
// were seeing on certain car listings.

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

function isUsableSrc(src) {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true; // local public asset
  if (trimmed.startsWith("data:image/")) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
}

export default function SafeImage({
  src,
  alt = "",
  fallback = null,
  onLoadingComplete,
  ...rest
}) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!isUsableSrc(src) || errored) {
    if (fallback) return fallback;
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-900 text-slate-300 dark:text-slate-600">
        <ImageOff className="w-8 h-8" aria-hidden />
        <span className="sr-only">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      onLoadingComplete={onLoadingComplete}
      {...rest}
    />
  );
}
