"use client";
// src/components/BrowsePanel.js
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { BRANDS, BODY_TYPES } from "@/lib/browse-catalog";

const FLOATING_PANEL_DEFAULT =
  "rounded-xl bg-white/95 dark:bg-[#131313]/95 p-2.5 sm:p-3 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.22)] dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.05] dark:ring-white/[0.07]";

const FLOATING_PANEL_HERO =
  "rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-3 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-md";

const QUICK_SEARCH_CHIPS = [
  { label: "SUV under 3M", href: "/cars?bodyType=SUV&maxPrice=3000000" },
  { label: "Fuel Efficient", href: "/cars?fuelType=HYBRID" },
  { label: "Family Cars", href: "/cars?bodyType=MINIVAN" },
  { label: "Low Maintenance", href: "/cars?make=Toyota" },
];

function BrandLogo({ name, make, img }) {
  const [failed, setFailed] = useState(false);
  const src = `/images/logos/${img}`;
  const makeQuery = make || name;

  return (
    <Link
      href={`/cars/${slugifyCarSegment(makeQuery)}`}
      className="group flex flex-col items-center justify-center gap-1.5 p-2 sm:p-2.5 w-[72px] sm:w-[78px] lg:w-[86px] rounded-lg border border-[#ebe5dc] dark:border-zinc-800 bg-white/90 dark:bg-[#111111]/80 hover:border-[#38A169]/35 dark:hover:border-[#38A169]/40 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300"
    >
      <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 flex items-center justify-center">
        {failed ?
          <span className="text-lg font-black text-slate-700 dark:text-slate-300">{name[0]}</span>
        : (
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
      <span className="text-[10px] sm:text-[11px] lg:text-xs font-sans font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-center leading-tight">
        {name}
      </span>
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
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/row">
      {/* Left Fade + Button */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-6 w-16 z-10 pointer-events-none flex items-center pr-2 -ml-2">
          <button 
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
          maskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent' : 'black'} 0%, black 48px, black calc(100% - 48px), ${canScrollRight ? 'transparent' : 'black'} 100%)`,
          WebkitMaskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent' : 'black'} 0%, black 48px, black calc(100% - 48px), ${canScrollRight ? 'transparent' : 'black'} 100%)`
        }}
        className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 sm:gap-3 lg:gap-3.5 pb-4 -mx-1 sm:-mx-2 px-1 sm:px-2 scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Right Fade + Button */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-6 w-16 z-10 pointer-events-none flex items-center justify-end pl-2 -mr-2">
          <button 
            onClick={() => scroll("right")}
            className="w-10 h-10 mr-2 sm:mr-4 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-full opacity-0 sm:group-hover/row:opacity-100 scale-90 sm:group-hover/row:scale-100 transition-all duration-300 pointer-events-auto text-slate-900 dark:text-white hover:bg-white dark:hover:bg-zinc-800 hover:scale-110"
          >
            <ChevronRight className="w-5 h-5 mr-[-2px]" />
          </button>
        </div>
      )}
    </div>
  );
}

function BodyTypeCard({ label, value, img }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={`/cars?bodyType=${value}`}
      className="group flex flex-col items-center justify-center gap-1.5 p-2 sm:p-2.5 w-[80px] sm:w-[88px] lg:w-[96px] rounded-lg border border-[#ebe5dc] dark:border-zinc-800 bg-white/90 dark:bg-[#111111]/80 hover:border-[#38A169]/35 dark:hover:border-[#38A169]/40 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300"
    >
      <div className="w-[56px] h-7 sm:w-[60px] sm:h-7.5 lg:w-[66px] lg:h-8 flex items-center justify-center">
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
      <span className="text-[9px] sm:text-[10px] lg:text-[10px] font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-center leading-tight">
        {label}
      </span>
    </Link>
  );
}

function LocationCard({ name }) {
  return (
    <Link
      href={`/cars/${slugifyCarSegment(name)}`}
      className="group flex items-center justify-center gap-2 px-4 py-3 min-w-[120px] rounded-2xl border border-[#e8e2d9] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#ddd4c8] dark:hover:border-zinc-700 hover:shadow-md transition-all duration-300 whitespace-nowrap drop-shadow-sm"
    >
      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#38A169] transition-colors" />
      <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
        {name}
      </span>
    </Link>
  );
}

export default function BrowsePanel({ variant = "default" }) {
  const isHero = variant === "hero";
  const floatingPanel = isHero ? FLOATING_PANEL_HERO : FLOATING_PANEL_DEFAULT;
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
    <div className="w-full space-y-3 sm:space-y-4">
      <form onSubmit={handleSearch} className="relative w-full group">
        <Search
          className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
            isHero ? "text-slate-400 group-focus-within:text-[#6ee7a8]" : "text-slate-400 group-focus-within:text-[#38A169]"
          }`}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What car are you looking for?"
          className={
            isHero
              ? "w-full rounded-xl border border-white/15 bg-black/35 py-4 pl-12 sm:pl-14 pr-[7.5rem] sm:pr-32 text-base font-semibold text-white shadow-inner shadow-black/20 placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-[#38A169]/60 focus:ring-2 focus:ring-[#38A169]/20 transition-all backdrop-blur-sm"
              : "w-full bg-white dark:bg-[#0a0a0a] border border-[#e8e2d9] dark:border-zinc-800 text-slate-900 dark:text-white py-4 pl-14 pr-[120px] font-bold text-base shadow-sm focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all placeholder:font-normal placeholder:text-slate-400"
          }
          style={isHero ? undefined : { borderRadius: "var(--radius)" }}
        />
        <button
          type="submit"
          disabled={loadingLoc}
          className={
            isHero
              ? "absolute right-1.5 top-1.5 bottom-1.5 min-w-[5.5rem] sm:min-w-[6.5rem] rounded-lg bg-[#38A169] px-4 sm:px-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-[#2F855A] disabled:opacity-70 shadow-[0_8px_24px_-6px_rgba(56,161,105,0.55)]"
              : "absolute right-2 top-2 bottom-2 bg-[#38A169] hover:bg-[#2F855A] text-white px-6 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-70 flex items-center justify-center min-w-[100px]"
          }
          style={isHero ? undefined : { borderRadius: "var(--radius)" }}
        >
          {loadingLoc ? "Locating..." : "Search"}
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_SEARCH_CHIPS.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={
              isHero
                ? "rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] text-slate-300 backdrop-blur-sm transition-all hover:border-[#38A169]/40 hover:bg-white/10 hover:text-white"
                : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition-all hover:border-[#38A169] hover:text-[#2F855A] dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300"
            }
          >
            {chip.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className={floatingPanel}>
          <div className="flex items-center justify-between px-1 sm:px-2 mb-2">
            <p
              className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] ${
                isHero ? "text-slate-400" : "text-slate-500 dark:text-slate-300"
              }`}
            >
              Shop by brand
            </p>
            <Link
              href="/cars"
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] text-[#38A169] hover:underline whitespace-nowrap"
            >
              All Makes →
            </Link>
          </div>
          <ScrollableRow>
            {BRANDS.map((b) => (
              <div key={b.name} className="snap-start shrink-0">
                <BrandLogo name={b.name} make={b.make} img={b.img} />
              </div>
            ))}
          </ScrollableRow>
        </div>
        <div className={floatingPanel}>
          <div className="flex items-center justify-between px-1 sm:px-2 mb-2">
            <p
              className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] ${
                isHero ? "text-slate-400" : "text-slate-500 dark:text-slate-300"
              }`}
            >
              Shop by shape
            </p>
          </div>
          <ScrollableRow>
            {BODY_TYPES.map((bt) => (
              <div key={bt.value} className="snap-start shrink-0">
                <BodyTypeCard {...bt} />
              </div>
            ))}
          </ScrollableRow>
        </div>
      </div>

    </div>
  );
}
