"use client";
// src/components/BrowsePanel.js
import Link from "next/link";
import { useState } from "react";

const BRANDS = [
  { name: "Toyota",     slug: "toyota" },
  { name: "Nissan",     slug: "nissan" },
  { name: "Honda",      slug: "honda" },
  { name: "Mitsubishi", slug: "mitsubishi" },
  { name: "Isuzu",      slug: "isuzu" },
  { name: "Subaru",     slug: "subaru" },
  { name: "Suzuki",     slug: "suzuki" },
  { name: "Mazda",      slug: "mazda" },
  { name: "Daihatsu",   slug: "daihatsu" },
  { name: "BMW",        slug: "bmw" },
  { name: "Volkswagen", slug: "volkswagen" },
  { name: "Mercedes",   slug: "mercedes-benz" },
];

// Body type entries — label, query value, and a top-view silhouette emoji / icon URL
const BODY_TYPES = [
  { label: "Sedan",      value: "SEDAN",     img: "/images/bodies/sedan.png"      },
  { label: "Hatchback",  value: "HATCHBACK",  img: "/images/bodies/hatchback.png"  },
  { label: "SUV",        value: "SUV",        img: "/images/bodies/suv.png"        },
  { label: "Pickup",     value: "PICKUP",     img: "/images/bodies/pickup.png"     },
  { label: "Convertible",value: "CONVERTIBLE",img: "/images/bodies/convertible.png"},
  { label: "Coupe",      value: "COUPE",      img: "/images/bodies/coupe.png"      },
  { label: "Minivan",    value: "MINIVAN",    img: "/images/bodies/minivan.png"    },
  { label: "Wagon",      value: "WAGON",      img: "/images/bodies/wagon.png"      },
  { label: "Bus",        value: "BUS",        img: "/images/bodies/bus.png"        },
  { label: "Truck",      value: "TRUCK",      img: "/images/bodies/truck.png"      },
];

function BrandLogo({ name, slug }) {
  const [failed, setFailed] = useState(false);
  const src = `https://www.carlogos.org/car-logos/${slug}-logo.png`;

  return (
    <Link
      href={`/cars?make=${encodeURIComponent(name)}`}
      className="group flex flex-col items-center justify-center gap-2 p-3 w-24 rounded-2xl border border-transparent hover:border-[#ddd4c8] dark:hover:border-slate-800 hover:bg-white dark:hover:bg-white/5 transition-all duration-300"
    >
      <div className="w-12 h-12 flex items-center justify-center">
        {failed ? (
          <span className="text-lg font-black text-slate-700 dark:text-slate-300">{name[0]}</span>
        ) : (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-contain dark:brightness-200 dark:contrast-200"
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
            className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md"
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
            <div key={b.slug} className="snap-start shrink-0">
              <BrandLogo name={b.name} slug={b.slug} />
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
