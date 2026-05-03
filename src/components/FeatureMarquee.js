"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const CHIP_CARD =
  "shrink-0 max-w-[200px] truncate inline-flex items-center bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#166534] dark:text-emerald-200/90 text-[10px] font-bold px-2.5 py-1.5 border border-[#bbf7d0] dark:border-emerald-900/60 whitespace-nowrap";
const CHIP_DETAIL =
  "shrink-0 max-w-[min(280px,70vw)] truncate inline-flex items-center bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#166534] dark:text-emerald-200/90 text-[11px] font-bold px-3 py-2 border border-[#bbf7d0] dark:border-emerald-900/60 whitespace-nowrap";

function Chips({ features, chipClass, keyPrefix }) {
  return features.map((f, i) => (
    <span
      key={`${keyPrefix}${i}-${f}`}
      className={chipClass}
      style={{ borderRadius: "2px" }}
      title={f}
    >
      {f}
    </span>
  ));
}

/**
 * Feature tags: static row when they fit; endless horizontal marquee when they overflow
 * (news-bar style). Pauses on hover. Respects prefers-reduced-motion (horizontal scroll instead).
 */
export default function FeatureMarquee({ features, variant = "card" }) {
  const viewportRef = useRef(null);
  const rowRef = useRef(null);
  const [loop, setLoop] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [duration, setDuration] = useState(24);

  const chipClass = variant === "detail" ? CHIP_DETAIL : CHIP_CARD;
  const list = (Array.isArray(features) ? features : [])
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
  const listKey = list.join("\u0001");

  const remeasure = useCallback(() => {
    const vp = viewportRef.current;
    const row = rowRef.current;
    if (!vp || !row) return;

    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);

    const over = row.scrollWidth > vp.clientWidth + 2;
    setOverflowing(over);

    if (prefersReduced) {
      setLoop(false);
      return;
    }

    setLoop(over);
    if (over) {
      const w = row.scrollWidth;
      setDuration(Math.max(14, Math.min(52, w / 40)));
    }
  }, []);

  useLayoutEffect(() => {
    remeasure();
  }, [listKey, remeasure]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => remeasure());
    ro.observe(vp);
    return () => ro.disconnect();
  }, [remeasure]);

  if (!list.length) return null;

  return (
    <div
      ref={viewportRef}
      className={`w-full min-h-[30px] ${loop ? "overflow-hidden" : overflowing && reduced ? "overflow-x-auto no-scrollbar" : "overflow-hidden"}`}
    >
      {loop ? (
        <div
          className="feature-marquee-track flex w-max max-w-none"
          style={{ animationDuration: `${duration}s` }}
        >
          <div ref={rowRef} className="flex gap-2 shrink-0 pr-8">
            <Chips features={list} chipClass={chipClass} keyPrefix="a-" />
          </div>
          <div className="flex gap-2 shrink-0 pr-8" aria-hidden>
            <Chips features={list} chipClass={chipClass} keyPrefix="b-" />
          </div>
        </div>
      ) : (
        <div
          ref={rowRef}
          className={`flex gap-2 flex-nowrap py-0.5 ${overflowing && reduced ? "w-max" : ""}`}
        >
          <Chips features={list} chipClass={chipClass} keyPrefix="s-" />
        </div>
      )}
    </div>
  );
}
