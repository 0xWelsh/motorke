"use client";
// src/components/BrowsePanel.js
import Link from "next/link";
import { useState } from "react";

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
      className="group flex flex-col items-center justify-center gap-2 p-3 w-24 rounded-2xl border border-transparent hover:border-[#ddd4c8] dark:hover:border-slate-800 hover:bg-white dark:hover:bg-white/5 transition-all duration-300"
    >
      <div className="w-12 h-12 flex items-center justify-center">
        {failed ?
          <span className="text-lg font-black text-slate-700 dark:text-slate-300">{name[0]}</span>
        : (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-sm dark:invert"
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

function BodyTypeCard({ label, value, img }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={`/cars?bodyType=${value}`}
      className="group flex flex-col items-center justify-center gap-2 p-2 w-28 rounded-2xl border border-transparent hover:border-[#ddd4c8] dark:hover:border-slate-800 hover:bg-white dark:hover:bg-white/5 transition-all duration-300"
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

export default function BrowsePanel() {
  return (
    <div className="w-full space-y-6 pt-2">
      {/* Popular Brands */}
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Popular Brands
          </p>
          <Link
            href="/cars"
            className="text-[11px] font-black uppercase tracking-[0.12em] text-[#ff5a2f] hover:underline"
          >
            All Makes →
          </Link>
        </div>
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-4 [&::-webkit-scrollbar]:hidden -mx-2 px-2">
          {BRANDS.map((b) => (
            <div key={b.name} className="snap-start shrink-0">
              <BrandLogo name={b.name} img={b.img} />
            </div>
          ))}
        </div>
      </div>

      {/* Body Types */}
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Body Types
          </p>
        </div>
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-4 [&::-webkit-scrollbar]:hidden -mx-2 px-2">
          {BODY_TYPES.map((bt) => (
            <div key={bt.value} className="snap-start shrink-0">
              <BodyTypeCard {...bt} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
