"use client";
// src/components/BrowsePanel.js
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";

const BRANDS = [
  { name: "Toyota",     img: "logo_toyota.png" },
  { name: "Nissan",     img: "logo_nissan.png" },
  { name: "Honda",      img: "logo_honda.png" },
  { name: "Mitsubishi", img: "logo_mitsubishi.png" },
  { name: "Isuzu",      img: "logo_isuzu.png" },
  { name: "Subaru",     img: "logo_subaru.png" },
  { name: "Suzuki",     img: "logo_suzuki.png" },
  { name: "Mazda",      img: "logo_mazda.png" },
  { name: "Daihatsu",   img: "logo_daihatsu.png" },
  { name: "BMW",        img: "logo_bmw.png" },
  { name: "Volkswagen", img: "logo_volkswagen.png" },
  { name: "Mercedes",   img: "logo_mercedes.png" },
];

const COUNTIES = ["Nairobi", "Mombasa", "Nakuru", "Kisumu", "Uasin Gishu", "Kiambu", "Machakos", "Meru"];

// Body type entries — label, query value, and a top-view silhouette emoji / icon URL
const BODY_TYPES = [
  { label: "Sedan",      value: "SEDAN",     img: "/images/bodies/icon_type-sedan.svg"      },
  { label: "Hatchback",  value: "HATCHBACK",  img: "/images/bodies/icon_type-hatchback.svg"  },
  { label: "SUV",        value: "SUV",        img: "/images/bodies/icon_type-suv.svg"        },
  { label: "Pickup",     value: "PICKUP",     img: "/images/bodies/icon_type-pick-up.svg"     },
  { label: "Convertible",value: "CONVERTIBLE",img: "/images/bodies/icon_type-convertible.svg"},
  { label: "Coupe",      value: "COUPE",      img: "/images/bodies/icon_type-coupe.svg"      },
  { label: "Minivan",    value: "MINIVAN",    img: "/images/bodies/icon_type-mini-van.svg"    },
  { label: "Wagon",      value: "WAGON",      img: "/images/bodies/icon_type-station-wagon.svg"      },
  { label: "Bus",        value: "BUS",        img: "/images/bodies/icon_type-bus.svg"        },
  { label: "Truck",      value: "TRUCK",      img: "/images/bodies/icon_type-truck.svg"      },
];

function BrandLogo({ name, img }) {
  const [failed, setFailed] = useState(false);
  const src = `/images/logos/${img}`;

  return (
    <Link
      href={`/cars?make=${encodeURIComponent(name)}`}
      className="group flex flex-col items-center justify-center gap-2 p-3 w-24 rounded-2xl border border-transparent hover:border-[#ddd4c8] dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300"
    >
      <div className="w-12 h-12 flex items-center justify-center">
        {failed ?
          <span className="text-lg font-black text-slate-700 dark:text-slate-300">{name[0]}</span>
        : (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
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
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-6 -mx-4 px-4 scroll-smooth [&::-webkit-scrollbar]:hidden"
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
      className="group flex flex-col items-center justify-center gap-2 p-2 w-28 rounded-2xl border border-transparent hover:border-[#ddd4c8] dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300"
    >
      <div className="w-20 h-10 flex items-center justify-center">
        {!failed ? (
          <img
            src={img}
            alt={label}
            className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md dark:invert"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="text-2xl">🚗</span>
        )}
      </div>
      <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-center leading-tight">
        {label}
      </span>
    </Link>
  );
}

function LocationCard({ name }) {
  return (
    <Link
      href={`/cars?county=${encodeURIComponent(name)}`}
      className="group flex items-center justify-center gap-2 px-4 py-3 min-w-[120px] rounded-2xl border border-[#e8e2d9] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#ddd4c8] dark:hover:border-zinc-700 hover:shadow-md transition-all duration-300 whitespace-nowrap drop-shadow-sm"
    >
      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#38A169] transition-colors" />
      <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
        {name}
      </span>
    </Link>
  );
}

export default function BrowsePanel() {
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
    <div className="w-full space-y-4 sm:space-y-6 pt-2">
      {/* Search Bar with Geolocation */}
      <form onSubmit={handleSearch} className="relative mb-6 sm:mb-8 w-full group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#38A169] transition-colors" />
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What car are you looking for?"
          className="w-full bg-white dark:bg-[#0a0a0a] border border-[#e8e2d9] dark:border-zinc-800 text-slate-900 dark:text-white rounded-none py-4 pl-14 pr-[120px] font-bold text-base shadow-sm focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all placeholder:font-normal placeholder:text-slate-400"
        />
        <button 
          type="submit" 
          disabled={loadingLoc}
          className="absolute right-2 top-2 bottom-2 bg-[#38A169] hover:bg-[#2F855A] text-white px-6 rounded-none font-black text-xs uppercase tracking-widest transition-all disabled:opacity-70 flex items-center justify-center min-w-[100px]"
        >
          {loadingLoc ? "Locating..." : "Explore"}
        </button>
      </form>


      {/* Popular Brands & Body Types - tighter grouping */}
      <div className="flex flex-col gap-1">
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
              Shop by brand
            </p>
            <Link
              href="/cars"
              className="text-[11px] font-black uppercase tracking-[0.12em] text-[#38A169] hover:underline"
            >
              All Makes →
            </Link>
          </div>
          <ScrollableRow>
            {BRANDS.map((b) => (
              <div key={b.name} className="snap-start shrink-0">
                <BrandLogo name={b.name} img={b.img} />
              </div>
            ))}
          </ScrollableRow>
        </div>
        <div className="mt-1">
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
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
