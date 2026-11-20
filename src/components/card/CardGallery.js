"use client";

import { useEffect, useRef, useState } from "react";
import PictureImage from "@/components/PictureImage";

/**
 * Spotlight card slideshow: crossfade through up to 6 images, auto-advance
 * while the slide is in view and not hovered, dots for manual control.
 * Touch: horizontal swipe moves one frame.
 */
export default function CardGallery({ urls, alt, sizes, priority = false }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef(null);
  const inView = useRef(true);
  const touchX = useRef(null);

  const count = urls.length;

  useEffect(() => {
    if (count < 2) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = setInterval(() => {
      if (inView.current) setIndex((i) => (i + 1) % count);
    }, 3500);
    return () => clearInterval(t);
  }, [count, paused]);

  if (count < 2) return null;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 32) {
          setIndex((i) => (i + (dx < 0 ? 1 : count - 1)) % count);
        }
      }}
    >
      {urls.map((url, i) => (
        <div
          key={url + i}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <PictureImage
            src={url}
            alt={i === 0 ? alt : ""}
            priority={priority && i === 0}
            loading={i === 0 ? undefined : "lazy"}
            className="absolute inset-0 h-full w-full object-cover"
            sizes={sizes}
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center gap-1">
        {urls.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-white" : "w-1 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
