"use client";
// src/components/ImageGallery.js
// Mosaic-capable image gallery with lightbox for car detail page

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Share2, X } from "lucide-react";

export default function ImageGallery({ images, title }) {
  const primaryIdx = images?.findIndex((img) => img.isPrimary) ?? -1;
  const [active, setActive] = useState(primaryIdx >= 0 ? primaryIdx : 0);
  const [lightbox, setLightbox] = useState(false);
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

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prev, next]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title, url: window.location.href }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (!images?.length) {
    return (
      <div className="aspect-[16/9] bg-[#fbfcfe] dark:bg-[#111111] rounded-none flex items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-500">
        No image
      </div>
    );
  }

  const current = images[active];
  const mosaicMode = images.length >= 5;
  const remainingCount = Math.max(0, images.length - 5);

  return (
    <>
      {mosaicMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setActive(0);
              setLightbox(true);
            }}
            className="relative lg:row-span-2 aspect-[4/3] lg:aspect-auto lg:h-full rounded-sm overflow-hidden bg-[#fbfcfe] dark:bg-[#111111] group border border-[#ddd4c8] dark:border-slate-800"
            aria-label="Open hero image"
          >
            <Image
              src={images[0].url}
              alt={images[0].alt || title}
              fill
              priority
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            {images.length > 1 && (
               <span className="absolute bottom-2.5 right-2.5 lg:hidden bg-white/95 text-slate-800 dark:text-slate-200 text-[11px] font-extrabold uppercase tracking-[0.12em] px-2.5 py-1 rounded-sm shadow">
                 {images.length} Photos
               </span>
            )}
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center justify-center w-8 h-8 rounded-sm bg-white/90 text-slate-700 text-sm shadow">
              ↗
            </span>
          </button>

          {images.slice(1, 5).map((img, i) => {
            const idx = i + 1;
            const isLastVisible = idx === 4;

            return (
              <button
                type="button"
                key={`${img.url}-${idx}`}
                onClick={() => {
                  setLightbox(true);
                  // scroll to image later if necessary
                }}
                className="hidden lg:block relative aspect-[4/3] rounded-sm overflow-hidden bg-[#fbfcfe] dark:bg-[#111111] group"
                aria-label={`Open image ${idx + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${title} image ${idx + 1}`}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 50vw, 18vw"
                />
                {isLastVisible && remainingCount > 0 && (
                  <span className="absolute bottom-2 right-2 bg-white/95 text-slate-800 dark:text-slate-200 text-[11px] font-extrabold uppercase tracking-[0.12em] px-2.5 py-1 rounded-sm">
                    {remainingCount}+ Photos
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div
            className="relative aspect-[4/3] sm:aspect-[16/9] w-full bg-[#fbfcfe] dark:bg-[#111111] overflow-hidden cursor-pointer"
            onClick={() => setLightbox(true)}
            role="button"
            tabIndex={0}
            aria-label="Open image gallery"
          >
            <Image
              src={images[0].url}
              alt={images[0].alt || title}
              fill
              priority
              className="w-full h-full object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            {/* Mobile overlays matching the screenshot */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

            <button 
              onClick={handleShare}
              className="absolute bottom-4 left-4 w-10 h-10 bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors pointer-events-auto"
            >
              <Share2 className="text-slate-900 w-4 h-4" />
            </button>

            {images.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
                className="absolute bottom-4 right-4 bg-white px-4 py-2 text-[11px] font-black tracking-widest text-slate-900 shadow-md uppercase pointer-events-auto hover:bg-slate-50 transition-colors"
              >
                {images.length}+ PHOTOS
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="hidden lg:flex gap-2 overflow-x-auto pb-1 mt-3 scrollbar-none">
              {images.map((img, i) => (
                <button
                  type="button"
                  aria-label={`View image ${i + 1}`}
                  key={`${img.url}-${i}`}
                  onClick={() => setActive(i)}
                  className={`flex-shrink-0 w-20 h-14 rounded-sm overflow-hidden border-[1.5px] transition-all ${
                    i === active
                      ? "border-[#ff5a2f] opacity-100"
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
        </>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#111111] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 w-full bg-white dark:bg-[#111111] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setLightbox(false)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-[13px] font-black tracking-widest uppercase text-slate-900 dark:text-white truncate px-4 max-w-[200px] sm:max-w-[400px]">
              {title}
            </h2>
            <button
              onClick={handleShare}
              className="p-2 -mr-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Mosaic Grid scrollable area */}
          <div className="w-full flex justify-center pb-20">
            <div className="w-full max-w-4xl grid grid-cols-2 gap-1 p-1">
              {images.map((img, idx) => {
                // Let's create a predictable mosaic pattern:
                // Full width (col-span-2) for idx: 0, 3, 6, 9...
                // Half width (col-span-1) for everything else.
                const isFullWidth = idx % 3 === 0;

                return (
                  <div 
                    key={idx} 
                    className={`relative ${isFullWidth ? 'col-span-2 aspect-[4/3] sm:aspect-[16/9]' : 'col-span-1 aspect-square'} bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${title} photo ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes={isFullWidth ? "100vw" : "50vw"}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
