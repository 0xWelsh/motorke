"use client";
// src/components/BrowsePanel.js
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, createContext, useContext } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { BRANDS, BODY_TYPES } from "@/lib/browse-catalog";

const ScrollOffsetContext = createContext(0);

function useScrollShadowStyle() {
  const scrollLeft = useContext(ScrollOffsetContext);
  const shadowX = Math.round(-scrollLeft * 0.065);
  const shadowY = 14;
  const blur = 22;
  return {
    boxShadow: `${shadowX}px ${shadowY}px ${blur}px rgba(15, 23, 42, 0.16), ${Math.round(shadowX * 0.35)}px ${shadowY + 6}px ${blur + 8}px rgba(15, 23, 42, 0.08)`,
  };
}

function SuspendedChip({ children, className = "" }) {
  const shadowStyle = useScrollShadowStyle();
  return (
    <div
      className={`transition-[box-shadow,transform] duration-150 ease-out will-change-[box-shadow] ${className}`}
      style={shadowStyle}
    >
      {children}
    </div>
  );
}

function ChipWrapper({ floating, children }) {
  if (!floating) return children;
  return <SuspendedChip>{children}</SuspendedChip>;
}

function formatChipCount(count) {
  const n = Number(count) || 0;
  if (n <= 0) return "0";
  return n === 1 ? "1 car" : `${n.toLocaleString()} cars`;
}

const BRAND_CHIP_CLASS =
  "group flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 w-[76px] sm:w-[82px] lg:w-[88px] min-h-[92px] h-[92px] shrink-0";
const BODY_CHIP_CLASS =
  "group flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 w-[76px] sm:w-[82px] lg:w-[88px] min-h-[92px] h-[92px] shrink-0";

function ChipCount({ count, className = "text-[9px]" }) {
  return (
    <span
      className={`${className} font-bold tabular-nums leading-none min-h-[12px] flex items-center justify-center text-[#38A169]/85 dark:text-[#68d391]/90`}
    >
      {formatChipCount(count)}
    </span>
  );
}

function BrandLogo({ name, make, img, count, floating = false }) {
  const [failed, setFailed] = useState(false);
  const src = `/images/logos/${img}`;
  const makeQuery = make || name;

  const linkClass = floating
    ? `${BRAND_CHIP_CLASS} rounded-xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-md ring-1 ring-white/60 dark:ring-white/10 hover:bg-white dark:hover:bg-white/[0.1] hover:-translate-y-0.5 transition-all duration-300`
    : `${BRAND_CHIP_CLASS} rounded-lg border border-[#ebe5dc] dark:border-zinc-800 bg-white/90 dark:bg-[#111111]/80 hover:border-[#38A169]/35 dark:hover:border-[#38A169]/40 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300`;

  return (
    <ChipWrapper floating={floating}>
      <Link href={`/cars/${slugifyCarSegment(makeQuery)}`} className={linkClass}>
        <div className="w-8 h-8 sm:w-9 sm:h-9 flex shrink-0 items-center justify-center">
          {failed ? (
            <span className="text-lg font-black text-slate-700 dark:text-slate-300">{name[0]}</span>
          ) : (
            <Image
              src={src}
              alt={name}
              width={56}
              height={56}
              className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-center leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center w-full px-0.5">
          {name}
        </span>
        <ChipCount count={count} />
      </Link>
    </ChipWrapper>
  );
}

function BodyTypeCard({ label, value, img, count, floating = false }) {
  const [failed, setFailed] = useState(false);

  const linkClass = floating
    ? `${BODY_CHIP_CLASS} rounded-xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-md ring-1 ring-white/60 dark:ring-white/10 hover:bg-white dark:hover:bg-white/[0.1] hover:-translate-y-0.5 transition-all duration-300`
    : `${BODY_CHIP_CLASS} rounded-lg border border-[#ebe5dc] dark:border-zinc-800 bg-white/90 dark:bg-[#111111]/80 hover:border-[#38A169]/35 dark:hover:border-[#38A169]/40 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300";

  return (
    <ChipWrapper floating={floating}>
      <Link href={`/cars?bodyType=${value}`} className={linkClass}>
        <div className="w-[56px] h-7 sm:h-8 flex shrink-0 items-center justify-center">
          {!failed ? (
            <Image
              src={img}
              alt={label}
              width={96}
              height={44}
              className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md dark:invert"
              onError={() => setFailed(true)}
            />
          ) : (
            <span className="text-2xl">🚗</span>
          )}
        </div>
        <span className="text-[9px] sm:text-[10px] font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-center leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center w-full px-0.5">
          {label}
        </span>
        <ChipCount count={count} className="text-[8px]" />
      </Link>
    </ChipWrapper>
  );
}

function ScrollableRow({ children, trackScrollOffset = false }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft: left, scrollWidth, clientWidth } = scrollRef.current;
      if (trackScrollOffset) setScrollLeft(left);
      setCanScrollLeft(left > 0);
      setCanScrollRight(Math.ceil(left + clientWidth) < scrollWidth);
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

  const row = (
      <div className="relative group/row">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-8 w-16 z-10 pointer-events-none flex items-center pr-2 -ml-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="w-10 h-10 ml-2 sm:ml-4 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-full opacity-0 sm:group-hover/row:opacity-100 scale-90 sm:group-hover/row:scale-100 transition-all duration-300 pointer-events-auto text-slate-900 dark:text-white hover:bg-white dark:hover:bg-zinc-800 hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 ml-[-2px]" />
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          style={{
            maskImage: `linear-gradient(to right, ${canScrollLeft ? "transparent" : "black"} 0%, black 48px, black calc(100% - 48px), ${canScrollRight ? "transparent" : "black"} 100%)`,
            WebkitMaskImage: `linear-gradient(to right, ${canScrollLeft ? "transparent" : "black"} 0%, black 48px, black calc(100% - 48px), ${canScrollRight ? "transparent" : "black"} 100%)`,
          }}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-4 pb-6 pt-1 -mx-1 sm:-mx-2 px-1 sm:px-2 scroll-smooth [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>

        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-8 w-16 z-10 pointer-events-none flex items-center justify-end pl-2 -mr-2">
            <button
              type="button"
              onClick={() => scroll("right")}
              className="w-10 h-10 mr-2 sm:mr-4 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-full opacity-0 sm:group-hover/row:opacity-100 scale-90 sm:group-hover/row:scale-100 transition-all duration-300 pointer-events-auto text-slate-900 dark:text-white hover:bg-white dark:hover:bg-zinc-800 hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 mr-[-2px]" />
            </button>
          </div>
        )}
      </div>
  );

  if (!trackScrollOffset) return row;
  return <ScrollOffsetContext.Provider value={scrollLeft}>{row}</ScrollOffsetContext.Provider>;
}

function ShopRowSection({ title, action }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between px-0.5 sm:px-1 mb-2 sm:mb-2.5">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
          {title}
        </p>
        {action}
      </div>
    </section>
  );
}

/**
 * @param {{ layout?: "full" | "hero-mobile" | "desktop-hero", inventoryCounts?: { brands?: Record<string, number>, bodyTypes?: Record<string, number> } }} props
 *   hero-mobile — search + shop by brand + shop by shape (homepage mobile hero)
 *   desktop-hero — full-width search in homepage left column
 */
export default function BrowsePanel({ layout = "full", inventoryCounts = null }) {
  const brandCounts = inventoryCounts?.brands || {};
  const bodyTypeCounts = inventoryCounts?.bodyTypes || {};
  const heroMobile = layout === "hero-mobile";
  const desktopHero = layout === "desktop-hero";
  const floatingChips = heroMobile;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoadingLoc(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingLoc(false);
          const { latitude, longitude } = position.coords;
          router.push(`/cars?search=${encodeURIComponent(query)}&lat=${latitude}&lng=${longitude}`);
        },
        () => {
          setLoadingLoc(false);
          router.push(`/cars?search=${encodeURIComponent(query)}`);
        },
        { timeout: 4000 }
      );
    } else {
      setLoadingLoc(false);
      router.push(`/cars?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className={`w-full space-y-3 sm:space-y-4 ${heroMobile || desktopHero ? "pt-0" : "pt-2"}`}>
      <form
        onSubmit={handleSearch}
        className={`relative w-full max-w-none group ${heroMobile ? "mb-3" : desktopHero ? "mb-5" : "mb-6 sm:mb-8"}`}
      >
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#38A169] transition-colors" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What car are you looking for?"
          className="w-full bg-white dark:bg-[#0a0a0a] border border-[#e8e2d9] dark:border-zinc-800 text-slate-900 dark:text-white rounded-none py-3.5 sm:py-4 pl-14 pr-[120px] font-bold text-base shadow-sm focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all placeholder:font-normal placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loadingLoc}
          className="absolute right-2 top-2 bottom-2 bg-[#38A169] hover:bg-[#2F855A] text-white px-6 rounded-none font-black text-xs uppercase tracking-widest transition-all disabled:opacity-70 flex items-center justify-center min-w-[100px]"
        >
          {loadingLoc ? "Locating..." : "Explore"}
        </button>
      </form>

      <div className="flex flex-col gap-4 sm:gap-5">
        <div>
          <ShopRowSection
            title="Shop by brand"
            action={
              <Link
                href="/cars"
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] text-[#38A169] hover:underline whitespace-nowrap"
              >
                All Makes →
              </Link>
            }
          />
          <ScrollableRow trackScrollOffset={floatingChips}>
            {BRANDS.map((b) => (
              <div key={b.name} className="snap-start shrink-0">
                <BrandLogo
                  name={b.name}
                  make={b.make}
                  img={b.img}
                  count={brandCounts[b.name]}
                  floating={floatingChips}
                />
              </div>
            ))}
          </ScrollableRow>
        </div>

        <div>
          <ShopRowSection title="Shop by shape" />
          <ScrollableRow trackScrollOffset={floatingChips}>
            {BODY_TYPES.map((bt) => (
              <div key={bt.value} className="snap-start shrink-0">
                <BodyTypeCard {...bt} count={bodyTypeCounts[bt.value]} floating={floatingChips} />
              </div>
            ))}
          </ScrollableRow>
        </div>
      </div>
    </div>
  );
}
