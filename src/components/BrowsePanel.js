"use client";
// src/components/BrowsePanel.js
import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { BRANDS, BODY_TYPES } from "@/lib/browse-catalog";

function formatChipCount(count) {
  const n = Number(count) || 0;
  if (n <= 0) return "0";
  return n === 1 ? "1 car" : `${n.toLocaleString()} cars`;
}

const CHIP_CLASS =
  "group flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 w-[76px] sm:w-[82px] lg:w-[88px] min-h-[92px] h-[92px] shrink-0 rounded-lg border border-slate-200 bg-white hover:border-[var(--accent)]/40 hover:bg-slate-50 transition-all duration-300";

function ChipCount({ count, className = "text-[9px]" }) {
  return (
    <span
      className={`${className} font-bold tabular-nums leading-none min-h-[12px] flex items-center justify-center text-[var(--accent)]`}
    >
      {formatChipCount(count)}
    </span>
  );
}

function BrandLogo({ name, make, img, count }) {
  const [failed, setFailed] = useState(false);
  const src = `/images/logos/${img}`;
  const makeQuery = make || name;

  return (
    <Link href={`/cars/${slugifyCarSegment(makeQuery)}`} className={CHIP_CLASS}>
      <div className="w-8 h-8 sm:w-9 sm:h-9 flex shrink-0 items-center justify-center">
        {failed ? (
          <span className="text-lg font-black text-slate-400">{name[0]}</span>
        ) : (
          <Image
            src={src}
            alt={name}
            width={56}
            height={56}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-slate-500 group-hover:text-slate-900 transition-colors text-center leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center w-full px-0.5">
        {name}
      </span>
      <ChipCount count={count} />
    </Link>
  );
}

function BodyTypeCard({ label, value, img, count }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link href={`/cars?bodyType=${value}`} className={CHIP_CLASS}>
      <div className="w-[56px] h-7 sm:h-8 flex shrink-0 items-center justify-center">
        {!failed ? (
          <Image
            src={img}
            alt={label}
            width={96}
            height={44}
            className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="text-2xl">🚗</span>
        )}
      </div>
      <span className="text-[9px] sm:text-[10px] font-black text-slate-500 group-hover:text-slate-900 transition-colors text-center leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center w-full px-0.5">
        {label}
      </span>
      <ChipCount count={count} className="text-[8px]" />
    </Link>
  );
}

function ScrollableRow({ children }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/row">
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-8 w-16 z-10 pointer-events-none flex items-center pr-2 -ml-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="w-10 h-10 ml-2 sm:ml-4 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-md opacity-0 sm:group-hover/row:opacity-100 scale-90 sm:group-hover/row:scale-100 transition-all duration-300 pointer-events-auto text-slate-500 hover:text-slate-900"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 ml-[-2px]" />
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-4 pb-6 pt-1 -mx-1 sm:-mx-2 px-1 sm:px-2 scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-8 w-16 z-10 pointer-events-none flex items-center justify-end pl-2 -mr-2">
          <button
            type="button"
            onClick={() => scroll("right")}
            className="w-10 h-10 mr-2 sm:mr-4 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-full opacity-0 sm:group-hover/row:opacity-100 scale-90 sm:group-hover/row:scale-100 transition-all duration-300 pointer-events-auto text-slate-500 hover:text-slate-900"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 mr-[-2px]" />
          </button>
        </div>
      )}
    </div>
  );
}

function ShopRowSection({ title, action }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between px-0.5 sm:px-1 mb-2 sm:mb-2.5">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          {title}
        </p>
        {action}
      </div>
    </section>
  );
}

/**
 * @param {{ layout?: "full" | "hero-mobile" | "hero-mobile-slim" | "desktop-hero", inventoryCounts?: { brands?: Record<string, number>, bodyTypes?: Record<string, number> } }} props
 */
export default function BrowsePanel({ layout = "full", inventoryCounts = null }) {
  const brandCounts = inventoryCounts?.brands || {};
  const bodyTypeCounts = inventoryCounts?.bodyTypes || {};
  const heroMobile = layout === "hero-mobile" || layout === "hero-mobile-slim";
  const heroMobileSlim = layout === "hero-mobile-slim";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmed = query.trim();
    // Navigate immediately — don't block the click on the geolocation prompt
    // (up to 4s, and indefinitely while the user reads the browser dialog).
    // Location is a refinement, so add it as a follow-up replace().
    router.push(`/cars?search=${encodeURIComponent(trimmed)}`);

    setLoadingLoc(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingLoc(false);
          const { latitude, longitude } = position.coords;
          router.replace(
            `/cars?search=${encodeURIComponent(trimmed)}&lat=${latitude}&lng=${longitude}`,
            { scroll: false }
          );
        },
        () => setLoadingLoc(false),
        { timeout: 4000, maximumAge: 300000 }
      );
    } else {
      setLoadingLoc(false);
    }
  };

  return (
    <div className={`w-full space-y-3 sm:space-y-4 ${heroMobile || layout === "desktop-hero" ? "pt-0" : "pt-2"}`}>
      <form
        onSubmit={handleSearch}
        className={`relative w-full max-w-none group ${heroMobile ? "mb-3" : layout === "desktop-hero" ? "mb-5" : "mb-6 sm:mb-8"}`}
      >
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--accent)] transition-colors" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What car are you looking for?"
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3.5 sm:py-4 pl-14 pr-[120px] font-bold text-base focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all placeholder:font-normal placeholder:text-slate-400 shadow-sm"
        />
        {/* The label no longer changes on submit — the click already navigated,
            so a "Locating..." label on a still-live button read as frozen. */}
        <button
          type="submit"
          aria-busy={loadingLoc}
          className="absolute right-2 top-2 bottom-2 px-6 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center min-w-[100px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
        >
          Search
        </button>
      </form>

      <div className="flex flex-col gap-4 sm:gap-5">
        <div>
          <ShopRowSection
            title="Shop by brand"
            action={
              <Link
                href="/cars"
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)] hover:underline whitespace-nowrap"
              >
                All Makes →
              </Link>
            }
          />
          <ScrollableRow>
            {BRANDS.map((b) => (
              <div key={b.name} className="snap-start shrink-0">
                <BrandLogo name={b.name} make={b.make} img={b.img} count={brandCounts[b.name]} />
              </div>
            ))}
          </ScrollableRow>
        </div>

        {!heroMobileSlim && (
          <div>
            <ShopRowSection title="Shop by shape" />
            <ScrollableRow>
              {BODY_TYPES.map((bt) => (
                <div key={bt.value} className="snap-start shrink-0">
                  <BodyTypeCard {...bt} count={bodyTypeCounts[bt.value]} />
                </div>
              ))}
            </ScrollableRow>
          </div>
        )}
      </div>
    </div>
  );
}
