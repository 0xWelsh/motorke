"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "@/components/SafeImage";
import { getHeroImageUrl, getGalleryImageUrl, getPreloadImageUrl, getThumbnailUrl, saveDataQuality } from "@/lib/image-transform";
import { useSaveData } from "@/components/SaveDataProvider";
import { ArrowLeft, Heart, MoreHorizontal, X, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

const SWIPE_THRESHOLD = 48;
const MAX_ZOOM = 4;
const DOUBLE_TAP_MS = 300;
const DRAG_LOCK = 10;

export default function ImageGallery({ images, title, carId, isLoggedIn }) {
  const router = useRouter();
  const saveData = useSaveData();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [navOpaque, setNavOpaque] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Drag/translate state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const heroTouchRef = useRef(null);
  const justSwipedRef = useRef(false);
  const heroRef = useRef(null);

  // Lightbox zoom/pan
  const [scale, setScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const lbTouchRef = useRef(null);
  const lastTapRef = useRef(0);
  const lbCarouselRef = useRef(null);
  const [lbDragOffset, setLbDragOffset] = useState(0);
  const [lbDragging, setLbDragging] = useState(false);
  const menuRef = useRef(null);

  // Check initial saved state on mount
  useEffect(() => {
    if (!isLoggedIn || !carId) return;
    fetch(`/api/saved/${carId}`)
      .then(r => r.json())
      .then(data => setSaved(data.saved))
      .catch(() => {});
  }, [carId, isLoggedIn]);

  // Scroll → nav opacity
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNavOpaque(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Close three-dot menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Lightbox: prevent body scroll + push history state for back-navigation
  useEffect(() => {
    if (!lightbox) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    window.history.pushState({ lightbox: true }, "");

    const onPop = () => setLightbox(false);
    const onKey = (e) => { if (e.key === "Escape") setLightbox(false); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      if (window.history.state?.lightbox) {
        window.history.back();
      }
    };
  }, [lightbox]);

  const goNext = useCallback(() => {
    if (!images?.length) return;
    setActive((i) => (i + 1) % images.length);
    setScale(1);
    setPanPos({ x: 0, y: 0 });
  }, [images]);

  const goPrev = useCallback(() => {
    if (!images?.length) return;
    setActive((i) => (i - 1 + images.length) % images.length);
    setScale(1);
    setPanPos({ x: 0, y: 0 });
  }, [images]);

  // ── Hero swipe ──
  const onHeroTouchStart = (e) => {
    heroTouchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      moved: false,
    };
    setIsDragging(false);
    setDragOffset(0);
  };

  const onHeroTouchMove = (e) => {
    if (!heroTouchRef.current) return;
    const dx = e.touches[0].clientX - heroTouchRef.current.startX;
    const dy = e.touches[0].clientY - heroTouchRef.current.startY;

    if (!heroTouchRef.current.moved && Math.abs(dx) < DRAG_LOCK && Math.abs(dy) < DRAG_LOCK) return;
    if (!heroTouchRef.current.moved && Math.abs(dx) < Math.abs(dy)) return;

    e.preventDefault();
    heroTouchRef.current.moved = true;
    setIsDragging(true);
    setDragOffset(dx);
  };

  const onHeroTouchEnd = (e) => {
    if (!heroTouchRef.current) return;
    const { startX, startY, moved } = heroTouchRef.current;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    if (moved) {
      justSwipedRef.current = true;
      setTimeout(() => { justSwipedRef.current = false; }, 400);
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx > 0) goPrev();
        else goNext();
      }
    } else {
      if (Math.abs(dx) > DRAG_LOCK || Math.abs(dy) > DRAG_LOCK) {
        justSwipedRef.current = true;
        setTimeout(() => { justSwipedRef.current = false; }, 400);
      } else {
        setLightbox(true);
      }
    }

    setIsDragging(false);
    setDragOffset(0);
    heroTouchRef.current = null;
  };

  const handleHeroClick = () => {
    if (justSwipedRef.current) return;
    setLightbox(true);
  };

  // ── Save toggle ──
  const toggleSave = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setSaving(true);
    try {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch(`/api/saved/${carId}`, { method });
      const data = await res.json();
      setSaved(data.saved);
    } catch {}
    setSaving(false);
  };

  // ── Share ──
  const handleShare = async () => {
    setMenuOpen(false);
    if (navigator.share) {
      try { await navigator.share({ title, url: window.location.href }); } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const copyLink = () => {
    setMenuOpen(false);
    navigator.clipboard.writeText(window.location.href);
  };

  // ── Lightbox carousel swipe + zoom/pan ──
  const onLbTouchStart = (e) => {
    const touches = e.touches;

    if (touches.length === 1 && scale <= 1) {
      lbCarouselRef.current = {
        startX: touches[0].clientX,
        startY: touches[0].clientY,
      };
      setLbDragging(false);
      setLbDragOffset(0);
    } else {
      lbTouchRef.current = {
        touches: Array.from(touches).map((t) => ({ x: t.clientX, y: t.clientY })),
        scale,
        pan: { ...panPos },
      };
    }
  };

  const onLbTouchMove = (e) => {
    const touches = Array.from(e.touches);

    if (lbCarouselRef.current && touches.length === 1) {
      const dx = touches[0].clientX - lbCarouselRef.current.startX;
      const dy = touches[0].clientY - lbCarouselRef.current.startY;

      if (!lbCarouselRef.current.moved && Math.abs(dx) < DRAG_LOCK && Math.abs(dy) < DRAG_LOCK) return;
      if (!lbCarouselRef.current.moved && Math.abs(dx) < Math.abs(dy)) return;

      e.preventDefault();
      lbCarouselRef.current.moved = true;
      setLbDragging(true);
      setLbDragOffset(dx);
      return;
    }

    if (!lbTouchRef.current) return;

    if (touches.length === 2) {
      e.preventDefault();
      const prev = lbTouchRef.current.touches;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pdx = prev[0].x - prev[1].x;
      const pdy = prev[0].y - prev[1].y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      const newScale = Math.min(MAX_ZOOM, Math.max(1, lbTouchRef.current.scale * (dist / pDist)));
      setScale(newScale);
    } else if (touches.length === 1 && scale > 1) {
      const dx = touches[0].clientX - lbTouchRef.current.touches[0].x;
      const dy = touches[0].clientY - lbTouchRef.current.touches[0].y;
      setPanPos({
        x: lbTouchRef.current.pan.x + dx,
        y: lbTouchRef.current.pan.y + dy,
      });
    }
  };

  const onLbTouchEnd = (e) => {
    if (lbCarouselRef.current) {
      const { startX, moved } = lbCarouselRef.current;
      const dx = e.changedTouches[0].clientX - startX;

      if (moved && Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx > 0) goPrev();
        else goNext();
      }

      setLbDragging(false);
      setLbDragOffset(0);
      lbCarouselRef.current = null;
      return;
    }

    if (!lbTouchRef.current) return;

    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      setScale((s) => (s > 1 ? 1 : 2.5));
      setPanPos({ x: 0, y: 0 });
      lastTapRef.current = 0;
      lbTouchRef.current = null;
      return;
    }
    lastTapRef.current = now;
    lbTouchRef.current = null;
  };

  if (!images?.length) {
    return (
      <div className="w-full aspect-video bg-[#fbfcfe] flex items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-500 max-h-[600px]">
        No image
      </div>
    );
  }

  const trackStyle = (baseIdx) => ({
    transform: `translateX(calc(-${baseIdx * 100}% + ${dragOffset}px))`,
    transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    willChange: "transform",
  });

  return (
    <>
      {/* ── Hero carousel ── */}
      <div
        id="hero-gallery"
        ref={heroRef}
        className="relative w-full h-[40vh] min-h-[280px] max-h-[400px] lg:h-auto lg:aspect-video lg:max-h-[600px] bg-[#fbfcfe] overflow-hidden select-none lg:rounded-lg"
      >
        {/* Slide track */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={trackStyle(active)}
          onTouchStart={onHeroTouchStart}
          onTouchMove={onHeroTouchMove}
          onTouchEnd={onHeroTouchEnd}
          onClick={handleHeroClick}
        >
          <div className="flex h-full">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-full h-full flex-shrink-0"
                aria-hidden={i !== active && !isDragging}
              >
                <Image
                  src={getGalleryImageUrl(img.url, saveDataQuality(saveData, 85))}
                  alt={img.alt || `${title} photo ${i + 1}`}
                  fill
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  quality={saveDataQuality(saveData, 85)}
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlay for nav readability */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

        {/* ── Overlay nav ── */}
        <div
          className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-2 transition-colors duration-300 ${
            navOpaque ? "bg-white shadow-sm" : "bg-transparent"
          }`}
        >
          {/* Back */}
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/cars"))}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
              navOpaque
                ? "text-slate-900 hover:bg-slate-100"
                : "text-white/90 hover:bg-white/20"
            }`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Save */}
            <button
              type="button"
              onClick={toggleSave}
              disabled={saving}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                navOpaque
                  ? saved ? "text-red-500" : "text-slate-500 hover:text-red-400 hover:bg-slate-100"
                  : saved ? "text-red-400" : "text-white/80 hover:bg-white/20"
              }`}
              aria-label={saved ? "Remove from saved" : "Save this car"}
            >
              <Heart
                className="w-5 h-5"
                strokeWidth={2}
                fill={saved ? "currentColor" : "none"}
              />
            </button>

            {/* Three-dots */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                  navOpaque
                    ? "text-slate-500 hover:bg-slate-100"
                    : "text-white/80 hover:bg-white/20"
                }`}
                aria-label="More options"
              >
                <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Copy link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Photo count badge ── */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="tabular-nums">{active + 1} / {images.length}</span>
          </button>
        )}

        {/* Side arrows on desktop */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); justSwipedRef.current = true; setTimeout(() => { justSwipedRef.current = false; }, 400); goPrev(); }}
              className="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center bg-white/80 text-slate-700 rounded-full shadow-sm hover:bg-white transition-colors"
              aria-label="Previous photo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); justSwipedRef.current = true; setTimeout(() => { justSwipedRef.current = false; }, 400); goNext(); }}
              className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center bg-white/80 text-slate-700 rounded-full shadow-sm hover:bg-white transition-colors"
              aria-label="Next photo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators on desktop */}
        {images.length > 1 && (
          <div className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 z-20 items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                className={`transition-all rounded-full ${
                  i === active
                    ? "w-5 h-1.5 bg-white shadow-sm"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div className="hidden lg:flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setActive(i); setScale(1); setPanPos({ x: 0, y: 0 }); }}
              className={`relative shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-emerald-500 ring-1 ring-emerald-500"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={getThumbnailUrl(img.url, 160, saveDataQuality(saveData, 60))}
                alt={img.alt || `${title} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                loading="lazy"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black touch-none select-none"
          onTouchStart={onLbTouchStart}
          onTouchMove={onLbTouchMove}
          onTouchEnd={onLbTouchEnd}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            className="absolute top-3 right-3 z-[110] w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" strokeWidth={2} />
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-4 z-[110] text-[12px] font-semibold tracking-wide text-white/50">
            {active + 1} / {images.length}
          </span>

          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-[105] pointer-events-none" />

          {/* Carousel track */}
          <div
            className="absolute inset-0 z-[105] overflow-hidden"
            onClick={() => { if (scale <= 1 && !lbDragging) setLightbox(false); }}
          >
            <div
              className="flex h-full"
              style={{
                transform: `translateX(calc(-${active * 100}% + ${lbDragOffset}px))`,
                transition: lbDragging ? "none" : "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                willChange: "transform",
              }}
            >
              {images.map((img, i) => (
                <div key={i} className="relative w-full h-full flex-shrink-0 flex items-center justify-center">
                  <div
                    className="relative w-full h-full flex items-center justify-center"
                    style={i === active ? {
                      transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${scale})`,
                      transition: lbTouchRef.current ? "none" : "transform 0.2s ease-out",
                      willChange: "transform",
                    } : {}}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={getHeroImageUrl(img.url)}
                      alt={img.alt || `${title} photo ${i + 1}`}
                      fill
                      quality={saveDataQuality(saveData, 90)}
                      className="object-contain"
                      priority={i === active}
                      fetchPriority={i === active ? "high" : "auto"}
                      sizes="100vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows in lightbox */}
          {images.length > 1 && (
            <>
              {/* Desktop arrows */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-[115] w-10 h-10 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-sm hover:bg-white/30 transition-all"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-[115] w-10 h-10 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-sm hover:bg-white/30 transition-all"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Bottom gradient + thumbnail strip */}
              <div className="absolute bottom-0 left-0 right-0 z-[110] bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-none justify-center">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActive(i); setScale(1); setPanPos({ x: 0, y: 0 }); }}
                      className={`relative flex-shrink-0 w-14 h-10 overflow-hidden rounded-lg border-2 transition-all ${
                        i === active
                          ? "border-white opacity-100 scale-105 shadow-lg"
                          : "border-transparent opacity-50 hover:opacity-80"
                      }`}
                    >
                      <Image
                        src={getThumbnailUrl(img.url, 160, saveDataQuality(saveData, 50))}
                        alt={img.alt || `Thumbnail ${i + 1}`}
                        fill
                        loading="lazy"
                        decoding="async"
                        quality={50}
                        className="object-cover"
                        sizes="60px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
