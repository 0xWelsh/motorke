"use client";

// src/components/SafeImage.js
// Thin wrapper around next/image that handles broken / unreachable URLs
// gracefully. Without this, a failed image (404, blocked optimizer, dead
// CDN, etc.) shows the browser's broken-image icon — which is what users
// were seeing on certain car listings.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { trackUiEvent } from "@/lib/analytics";
import { normalizeListingHeroImageUrl } from "@/lib/listing-image-url";

function isUsableSrc(src) {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true; // local public asset
  if (trimmed.startsWith("data:image/")) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
}

// Browser-local rate limit so a single broken URL appearing on a 50-card
// listing doesn't spam analytics with 50 identical events. We keep one
// short-lived entry per src+host.
const recentErrors = new Map();
const ERROR_WINDOW_MS = 60_000;

function rememberError(src) {
  if (typeof window === "undefined" || !src) return false;
  const now = Date.now();
  const last = recentErrors.get(src);
  if (last && now - last < ERROR_WINDOW_MS) return false;
  recentErrors.set(src, now);
  // GC old entries.
  if (recentErrors.size > 200) {
    for (const [k, v] of recentErrors) {
      if (now - v > ERROR_WINDOW_MS * 5) recentErrors.delete(k);
    }
  }
  return true;
}

function hostOf(src) {
  try {
    if (!src || typeof src !== "string") return "";
    if (src.startsWith("/")) return "self";
    return new URL(src).host;
  } catch {
    return "unknown";
  }
}

export default function SafeImage({
  src,
  alt = "",
  fallback = null,
  onLoadingComplete,
  ...rest
}) {
  const [errored, setErrored] = useState(false);
  const reportedRef = useRef(false);

  const resolvedSrc =
    typeof src === "string" && /^https?:\/\//i.test(src.trim())
      ? normalizeListingHeroImageUrl(src) || src.trim()
      : src;

  useEffect(() => {
    setErrored(false);
    reportedRef.current = false;
  }, [src]);

  if (!isUsableSrc(resolvedSrc) || errored) {
    if (fallback) return fallback;
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500">
        <ImageOff className="w-8 h-8" aria-hidden />
        <span className="sr-only">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      onError={(event) => {
        setErrored(true);
        if (reportedRef.current) return;
        reportedRef.current = true;
        if (!rememberError(resolvedSrc)) return;
        try {
          trackUiEvent("image_load_failed", {
            host: hostOf(resolvedSrc),
            src_path: (() => {
              try {
                return new URL(resolvedSrc).pathname;
              } catch {
                return "";
              }
            })(),
            natural_width: event?.target?.naturalWidth ?? 0,
          });
        } catch {
          // ignore
        }
      }}
      onLoadingComplete={onLoadingComplete}
      {...rest}
    />
  );
}
