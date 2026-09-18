"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { carListingPath } from "@/lib/car-listing-url";
import { getThumbnailUrl } from "@/lib/image-transform";
import NikkyoStockCard from "@/components/NikkyoStockCard";

const SWIPE_THRESHOLD = 50;

export default function HeroCarousel({ cars = [] }) {
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragStartRef = useRef(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    if (dragging || cars.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % cars.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [cars.length, dragging]);

  if (!cars.length) return null;

  const safeIndex = index % cars.length;
  const car = cars[safeIndex];
  const imgUrl = car?.images?.[0]?.url ?? car?.image;

  const details = [
    car.mileage ? `${Number(car.mileage).toLocaleString("en-KE")} km` : null,
    car.fuelType || null,
    car.transmission || null,
  ].filter(Boolean);

  const go = (dir) => setIndex((safeIndex + dir + cars.length) % cars.length);

  function onPointerDown(e) {
    dragStartRef.current = e.clientX;
    draggedRef.current = false;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture is best-effort
    }
  }

  function onPointerMove(e) {
    if (dragStartRef.current == null) return;
    const delta = e.clientX - dragStartRef.current;
    if (Math.abs(delta) > 8) draggedRef.current = true;
    setDragX(delta);
  }

  function endSwipe(e) {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endSwipe);
    window.removeEventListener("pointercancel", cancelSwipe);
    const start = dragStartRef.current;
    dragStartRef.current = null;
    setDragging(false);
    if (start == null) return;
    const delta = e.clientX - start;
    if (delta <= -SWIPE_THRESHOLD) go(1);
    else if (delta >= SWIPE_THRESHOLD) go(-1);
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      // The browser fires a click right after this drag; keep `draggedRef`
      // truthy so that click is swallowed, then reset it for the next tap.
      setTimeout(() => {
        draggedRef.current = false;
      }, 50);
    }
    setDragX(0);
  }

  function cancelSwipe() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endSwipe);
    window.removeEventListener("pointercancel", cancelSwipe);
    dragStartRef.current = null;
    setDragging(false);
    setDragX(0);
  }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragStartRef.current = e.clientX;
    draggedRef.current = false;
    setDragging(true);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endSwipe);
    window.addEventListener("pointercancel", cancelSwipe);
  }

  const gridCars = cars.slice(1, 5);

  return (
    <div className="relative">
      <div className="lg:flex lg:items-center lg:justify-center lg:gap-2">
        <div
          className="relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-none border-0 border-slate-200 bg-slate-100 sm:mx-auto sm:max-w-[267px] sm:rounded-xl sm:border sm:shadow-sm lg:mx-0 lg:w-[390px] lg:max-w-none lg:shrink-0"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
        <div className="absolute inset-0">
          {imgUrl ? (
            <Image
              src={getThumbnailUrl(imgUrl, 1280)}
              alt={`${car.year} ${car.make} ${car.model}`}
              fill
              priority
              draggable={false}
              className="object-cover will-change-transform"
              style={{
                transform: `translateX(${dragX}px)`,
                transition: dragging ? "none" : "transform 250ms ease",
              }}
              sizes="(min-width:1024px) 390px, (min-width:640px) 267px, 100vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl font-black text-slate-300">{car.make?.[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden />
        </div>

        <Link
          href={carListingPath(car)}
          onClick={(e) => {
            if (draggedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              draggedRef.current = false;
            }
          }}
          className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-6"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
            {car.year} · {car.make}
          </p>
          <h2 className="mt-0.5 text-xl font-black leading-tight text-white sm:text-2xl lg:text-3xl">
            {car.model}
            {car.variant ? ` ${car.variant}` : ""}
          </h2>
          {details.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {details.map((d) => (
                <span
                  key={d}
                  className="rounded bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm sm:text-[10px]"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-baseline gap-4">
            <span className="text-base font-black text-white sm:text-xl">
              KES {Number(car.price).toLocaleString("en-KE")}
            </span>
            <span className="hidden items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/85 sm:inline-flex">
              View details <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        {cars.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-90 shadow-sm transition-all hover:bg-white hover:opacity-100 sm:left-3 sm:h-10 sm:w-10"
              aria-label="Previous car"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-90 shadow-sm transition-all hover:bg-white hover:opacity-100 sm:right-3 sm:h-10 sm:w-10"
              aria-label="Next car"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </>
        )}
      </div>

      <div className="mt-2 hidden lg:mt-0 lg:grid lg:h-[292px] lg:w-[390px] lg:shrink-0 grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2">
        {gridCars.map((c, i) => (
          <NikkyoStockCard key={c.id} car={c} priority={i === 0} fill />
        ))}
      </div>
      </div>

      {cars.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {cars.slice(0, Math.min(cars.length, 8)).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === safeIndex ? "h-2 w-6 bg-[var(--accent)]" : "h-2 w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`View car ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
