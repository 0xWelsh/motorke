"use client";
// src/components/ImageGallery.js
// Swipeable image gallery with lightbox for car detail page

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";


export default function ImageGallery({ images, title }) {
  const primaryIdx = images.findIndex((img) => img.isPrimary);
  const [active, setActive]       = useState(primaryIdx >= 0 ? primaryIdx : 0);
  const [lightbox, setLightbox]   = useState(false);
  const touchStartX = useRef(null);

  const prev = useCallback(() =>
    setActive((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() =>
    setActive((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current;
    const delta = touchStartX.current - endX;
    touchStartX.current = null;

    if (Math.abs(delta) < 48) return;
    if (delta > 0) next();
    else prev();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prev, next]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  if (!images?.length) {
    return (
      <div className="aspect-[16/9] bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-500">
        No image
      </div>
    );
  }

  const current = images[active];

  return (
    <>
      {/* Main image */}
      <div
        className="relative aspect-[16/9] bg-white/5 rounded-2xl overflow-hidden group cursor-zoom-in"
        onClick={() => setLightbox(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightbox(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Open image gallery"
      >
        <Image
          src={current.url}
          alt={current.alt || title}
          fill
          priority
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />

        {/* Nav arrows on hover */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
            >
              ›
            </button>
          </>
        )}

        {/* Counter badge */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 text-xs bg-black/60 text-white/80 px-2.5 py-1 rounded-full backdrop-blur-sm">
            {active + 1} / {images.length}
          </span>
        )}

        {/* Expand hint */}
        <span className="absolute bottom-3 left-3 text-xs bg-black/50 text-white/70 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          Click to expand
        </span>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 scrollbar-none">
          {images.map((img, i) => (
            <button
              type="button"
              aria-label={`View image ${i + 1}`}
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-[#f97316] opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              } relative`}
            >
              <Image
                src={img.url}
                alt={img.alt || `Photo ${i + 1}`}
                fill
                className="w-full h-full object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Close lightbox"
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition-colors z-10"
            onClick={() => setLightbox(false)}
          >
            ×
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/50">
            {active + 1} / {images.length}
          </span>

          {/* Image */}
          <div className="relative w-[90vw] h-[85vh]">
            <Image
              src={current.url}
              alt={current.alt || title}
              fill
              className="object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white text-2xl rounded-full flex items-center justify-center transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white text-2xl rounded-full flex items-center justify-center transition-colors"
              >
                ›
              </button>
            </>
          )}

          {/* Thumbnail dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                type="button"
                aria-label={`Go to image ${i + 1}`}
                key={i}
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === active ? "bg-[#f97316] w-4" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
