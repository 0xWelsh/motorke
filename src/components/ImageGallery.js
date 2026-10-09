"use client";
import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Image from "@/components/SafeImage";
import { getHeroImageUrl, getGalleryImageUrl, getPreloadImageUrl, getThumbnailUrl, saveDataQuality, saveDataWidth } from "@/lib/image-transform";
import { saveDataGalleryLimits } from "@/lib/save-data";
import { useSaveData } from "@/components/SaveDataProvider";
import { useClientSession } from "@/hooks/use-client-session";
import { ArrowLeft, Heart, MoreHorizontal, X, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { markLightboxOpen, markLightboxClose } from "@/lib/back-nav";

const SWIPE_THRESHOLD = 48;
const DRAG_LOCK = 10;

export default function ImageGallery({ images, title, carId, isLoggedIn = null, sold = false }) {
  const router = useRouter();
  const { user: clientUser } = useClientSession();
  const effectiveLoggedIn = isLoggedIn !== null ? isLoggedIn : Boolean(clientUser);
  const [isPending, startTransition] = useTransition();
  const saveData = useSaveData();
  const galleryLimits = saveDataGalleryLimits(saveData, images?.length || 0);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [navOpaque, setNavOpaque] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [shareDone, setShareDone] = useState(false);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const heroTouchRef = useRef(null);
  const justSwipedRef = useRef(false);
  const heroRef = useRef(null);

  const lbCarouselRef = useRef(null);
  const [lbDragOffset, setLbDragOffset] = useState(0);
  const [lbDragging, setLbDragging] = useState(false);
  const [lbTouching, setLbTouching] = useState(false);
  const menuRef = useRef(null);
  const mobileThumbRef = useRef(null);

  // Keep the active thumbnail centered in the mobile strip as you swipe the
  // hero — it "moves with the photos" instead of getting left behind.
  useEffect(() => {
    const el = mobileThumbRef.current;
    if (!el) return;
    const btn = el.querySelector('[aria-current="true"]');
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  useEffect(() => {
    if (!effectiveLoggedIn || !carId) return;
    fetch(`/api/saved/${carId}`)
      .then(r => r.json())
      .then(data => setSaved(data.saved))
      .catch(() => {});
  }, [carId, effectiveLoggedIn]);

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

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!lightbox) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    markLightboxOpen();
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
      } else {
        markLightboxClose();
      }
    };
  }, [lightbox]);

  const goNext = useCallback(() => {
    if (!images?.length) return;
    setActive((i) => (i + 1) % images.length);
  }, [images]);

  const goPrev = useCallback(() => {
    if (!images?.length) return;
    setActive((i) => (i - 1 + images.length) % images.length);
  }, [images]);

  const openLightbox = useCallback(() => {
    setLightbox(true);
  }, []);

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
        openLightbox();
      }
    }

    setIsDragging(false);
    setDragOffset(0);
    heroTouchRef.current = null;
  };

  const handleHeroClick = () => {
    if (justSwipedRef.current) return;
    openLightbox();
  };

  const toggleSave = async () => {
    if (savingRef.current) return;

    const method = saved ? "DELETE" : "POST";
    const next = !saved;

    // Optimistic flip — the heart responds on this frame rather than after the
    // POST resolves. Don't gate on the client session: it is null until
    // /api/auth/me resolves, so an early click bounced signed-in users to
    // /login. A 401 from the API is the authoritative signal instead.
    savingRef.current = true;
    setSaved(next);
    setSaving(true);

    let res = null;
    try {
      res = await fetch(`/api/saved/${carId}`, { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("save failed");
      setSaved(typeof data.saved === "boolean" ? data.saved : next);
    } catch {
      setSaved(saved);
      if (res?.status === 401) router.push(`/login?next=${encodeURIComponent(`/cars/${carId}`)}`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setMenuOpen(false);
    // Flag the feedback state up front: the native share sheet can stay open
    // for a long time, and awaiting it first left the item looking dead.
    setShareDone(true);
    const shareTitle = sold ? `SOLD ${title}` : title;
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, url: window.location.href }); } catch {}
      return;
    }
    navigator.clipboard.writeText(window.location.href).catch(() => setShareDone(false));
  };

  const copyLink = () => {
    setMenuOpen(false);
    navigator.clipboard.writeText(window.location.href);
  };

  const onLbTouchStart = (e) => {
    const touches = e.touches;
    setLbTouching(true);

    // Only a single finger starts a swipe. A two-finger pinch is left to the
    // page so it cannot be mistaken for a photo zoom.
    if (touches.length === 1) {
      lbCarouselRef.current = {
        startX: touches[0].clientX,
        startY: touches[0].clientY,
      };
      setLbDragging(false);
      setLbDragOffset(0);
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
    }
    // Two-finger gestures are deliberately ignored: they are how a phone user
    // tries to magnify a photo, and letting them through fights the viewport
    // lock on the page and leaves the reader stuck in a zoomed photo.
  };

  const onLbTouchEnd = (e) => {
    setLbTouching(false);

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
    }
  };

  if (!images?.length) {
    return (
      <div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-400 max-h-[600px]">
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
      {/* Hero carousel */}
      <div
        id="hero-gallery"
        ref={heroRef}
        className="relative w-full aspect-[4/3] max-h-[52vh] sm:max-h-[420px] lg:h-auto lg:aspect-[4/3] lg:max-h-[640px] bg-slate-100 overflow-hidden select-none rounded-none border-0 lg:rounded-lg border-slate-200 bg-white shadow-none sm:shadow-sm"
      >
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
                  priority={i === 0 && !saveData}
                  fetchPriority={saveData ? "low" : i === 0 ? "high" : "auto"}
                  quality={saveDataQuality(saveData, 85)}
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* Overlay nav */}
        <div
          className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-2 transition-colors duration-300 ${
            navOpaque ? "bg-white/90 backdrop-blur-md" : "bg-transparent"
          }`}
        >
          <button
            type="button"
            onClick={() => startTransition(() => { window.history.length > 1 ? router.back() : router.push("/cars"); })}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
              navOpaque
                ? "text-slate-900 hover:bg-slate-100"
                : "text-white/90 hover:bg-white/20"
            }`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSave}
              aria-busy={saving}
              aria-pressed={saved}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                navOpaque
                  ? saved ? "text-red-500" : "text-slate-500 hover:text-red-500 hover:bg-slate-100"
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
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <Share2 className={`w-4 h-4 ${shareDone ? "text-emerald-600" : "text-slate-500"}`} />
                    {shareDone ? "Shared" : "Share"}
                  </button>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {/* Photo count badge */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={openLightbox}
            className="absolute bottom-3 left-3 lg:bottom-16 lg:left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="tabular-nums">{active + 1} / {images.length}</span>
          </button>
        )}

        {/* Expand gallery — desktop */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={openLightbox}
            className="hidden lg:inline-flex absolute bottom-16 right-3 z-20 items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full hover:bg-black/75 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
            Expand Gallery
          </button>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); justSwipedRef.current = true; setTimeout(() => { justSwipedRef.current = false; }, 400); goPrev(); }}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors active:scale-95"
              aria-label="Previous photo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); justSwipedRef.current = true; setTimeout(() => { justSwipedRef.current = false; }, 400); goNext(); }}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors active:scale-95"
              aria-label="Next photo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

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
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile thumbnails — quick switching without opening the lightbox */}
      {images.length > 1 && (
        <div ref={mobileThumbRef} className="flex gap-1.5 mt-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.slice(0, galleryLimits.maxThumbs).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-video w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                i === active
                  ? "border-[var(--sidebar-bar)] ring-1 ring-[var(--sidebar-bar)]/50"
                  : "border-transparent opacity-60"
              }`}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === active}
            >
              <Image
                src={getThumbnailUrl(img.url, 200, 70)}
                alt={img.alt || `${title} photo ${i + 1}`}
                fill
                loading="lazy"
                decoding="async"
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* All thumbnails grid — every photo visible at once (desktop) */}
      {images.length > 1 && (
        <div className="hidden lg:grid gap-1.5 mt-2 grid-cols-[repeat(auto-fill,minmax(72px,1fr))] pb-1">
          {images.slice(0, galleryLimits.maxThumbs).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-[var(--sidebar-bar)] ring-1 ring-[var(--sidebar-bar)]/50"
                  : "border-transparent opacity-60 hover:opacity-100 hover:brightness-110"
              }`}
            >
              <Image
                src={getThumbnailUrl(img.url, saveDataWidth(saveData, 160), saveDataQuality(saveData, 60))}
                alt={img.alt || `${title} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                loading="lazy"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black touch-none select-none"
          onTouchStart={onLbTouchStart}
          onTouchMove={onLbTouchMove}
          onTouchEnd={onLbTouchEnd}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            className="absolute top-3 right-3 z-[110] w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" strokeWidth={2} />
          </button>

          <span className="absolute top-4 left-4 z-[110] text-[12px] font-semibold tracking-wide text-white/50">
            {active + 1} / {images.length}
          </span>

          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-[105] pointer-events-none" />

          <div
            className="absolute inset-0 z-[105] overflow-hidden"
            onClick={(e) => {
              // Mouse click on the backdrop (or the photo) closes; clicks on
              // controls are stopPropagation'd. Touch keeps its swipe gesture.
              if (e.nativeEvent.pointerType && e.nativeEvent.pointerType !== "mouse") return;
              if (lbDragging) return;
              setLightbox(false);
            }}
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
              ))}
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-[115] w-10 h-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-[115] w-10 h-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div className="absolute bottom-0 left-0 right-0 z-[110] bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-none justify-center">
                  {images.slice(0, galleryLimits.maxThumbs).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActive(i); }}
                      className={`relative flex-shrink-0 w-14 h-10 overflow-hidden rounded-lg border-2 transition-all ${
                        i === active
                          ? "border-white opacity-100 scale-105 shadow-lg"
                          : "border-transparent opacity-40 hover:opacity-70"
                      }`}
                    >
                      <Image
                        src={getThumbnailUrl(img.url, saveDataWidth(saveData, 160), saveDataQuality(saveData, 50))}
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
