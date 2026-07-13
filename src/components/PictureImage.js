"use client";

import { useEffect, useState, useRef } from "react";
import { ImageOff } from "lucide-react";



const SIZES = [
  { width: 200, suffix: "-200w.webp" },
  { width: 400, suffix: "-400w.webp" },
  { width: 800, suffix: "-800w.webp" },
];

function isR2Url(url) {
  if (!url || typeof url !== "string") return false;
  try { return new URL(url).hostname.endsWith(".r2.dev"); }
  catch { return false; }
}

function webpSrc(url, suffix) {
  return url.replace(/(\/[^/]+)\.\w+$/, `$1${suffix}`);
}

function isUsableSrc(src) {
  if (!src || typeof src !== "string") return false;
  const t = src.trim();
  if (!t) return false;
  if (t.startsWith("/") || t.startsWith("data:image/") || /^https?:\/\//i.test(t)) return true;
  return false;
}

export default function PictureImage({
  src,
  alt = "",
  fallback = null,
  className = "",
  style,
  fetchPriority,
  loading = "lazy",
  onError,
  ...rest
}) {
  const [errored, setErrored] = useState(false);
  const reportedRef = useRef(false);

  useEffect(() => {
    setErrored(false);
    reportedRef.current = false;
  }, [src]);

  if (!isUsableSrc(src) || errored) {
    if (fallback) return fallback;
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-600">
        <ImageOff className="w-8 h-8" aria-hidden />
        <span className="sr-only">Image unavailable</span>
      </div>
    );
  }

  const useResponsive = isR2Url(src);

  if (useResponsive) {
    const srcSetWebP = SIZES.map(
      (s) => `${webpSrc(src, s.suffix)} ${s.width}w`
    ).join(", ");
    const srcSetJpeg = SIZES.map(
      (s) => `${src} ${s.width}w`
    ).join(", ");

    return (
      <picture>
        <source type="image/webp" srcSet={srcSetWebP} sizes={rest.sizes || "100vw"} />
        <source type="image/jpeg" srcSet={srcSetJpeg} sizes={rest.sizes || "100vw"} />
        <img
          src={src}
          alt={alt}
          loading={loading}
          fetchPriority={fetchPriority}
          className={className}
          style={style}
          onError={() => {
            setErrored(true);
            reportedRef.current = true;
            if (onError) onError();
          }}
        />
      </picture>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      className={className}
      style={style}
      onError={() => {
        setErrored(true);
        reportedRef.current = true;
        if (onError) onError();
      }}
    />
  );
}
