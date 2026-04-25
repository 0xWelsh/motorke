"use client";
// src/components/SearchSuggestions.js
import { Search, Car, Tag, Check, ShieldCheck, MapPin } from "lucide-react";
import { formatCarPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function SearchSuggestions({ 
  suggestions = [],
  loading = false,
  onSelect,
  onClose,
  inputValue = "",
  className = ""
}) {
  if (!suggestions.length && !loading) return null;

  const suggestionTypes = {
    make: { icon: <Tag className="w-4 h-4 text-[#ff5a2f]" />, label: "Make" },
    model: { icon: <Car className="w-4 h-4 text-amber-600" />, label: "Model" },
    variant: { icon: <Tag className="w-4 h-4 text-slate-400" />, label: "Variant" },
    car: { icon: <Car className="w-4 h-4 text-green-600" />, label: "Car" },
  };

  // Separate cars from attributes
  const carSuggestions = suggestions.filter(s => s.type === "car");
  const attributeSuggestions = suggestions.filter(s => s.type !== "car");

  return (
    <div className={`absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-[#ddd4c8] dark:border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden max-w-[340px] min-w-[220px] ${className}`} style={{fontSize:'13px'}}>
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">Searching suggestions...</span>
          </div>
        </div>
      ) : (
        <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
          {/* Cars Section */}
          {carSuggestions.length > 0 && (
            <>
              <div className="px-3 py-2 bg-[#fbfcfe] dark:bg-white/5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Available Cars
                </p>
              </div>
              {carSuggestions.map((car) => (
                <Link
                  key={`car-${car.id}`}
                  href={`/cars/${car.id}`}
                  onClick={() => onClose?.()}
                  className="block px-3 py-2 hover:bg-[#fbfcfe] dark:hover:bg-zinc-800 transition-colors border-b border-slate-50 dark:border-zinc-800 last:border-0 group"
                  style={{fontSize:'13px'}}
                >
                  <div className="flex gap-2 items-center">
                    {/* Image */}
                    {car.image && (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-black dark:border-white">
                        <Image
                          src={car.image}
                          alt={car.value}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="font-playfair font-semibold text-slate-900 dark:text-white text-xs group-hover:text-[#ff5a2f] transition truncate">
                          {car.value}
                        </h3>
                        {car.dealerVerified && (
                          <ShieldCheck className="w-3 h-3 text-[#ff5a2f] flex-shrink-0 mt-0.5" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-green-600">
                          {formatCarPrice(car)}
                        </p>
                        {car.mileage && (
                          <p className="text-[11px] text-slate-500">
                            {car.mileage.toLocaleString()} km
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                        {car.dealerName && (
                          <>
                            <span className="truncate">{car.dealerName}</span>
                            {car.location && (
                              <>
                                <span>•</span>
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{car.location}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {/* Attributes Section (Makes/Models/Variants) */}
          {attributeSuggestions.length > 0 && (
            <>
              {carSuggestions.length > 0 && (
                <div className="px-4 sm:px-6 py-3 bg-[#fbfcfe] dark:bg-white/5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Makes & Models
                  </p>
                </div>
              )}
              {attributeSuggestions.map((suggestion, index) => {
                const typeInfo =
                  suggestionTypes[suggestion.type] || {
                    icon: <Tag className="w-4 h-4 text-slate-400" />,
                    label: "Result",
                  };

                // Highlight matching parts
                const matchIndex = suggestion.value
                  .toLowerCase()
                  .indexOf(inputValue.toLowerCase());
                const beforeMatch = suggestion.value.substring(0, matchIndex);
                const matchText = suggestion.value.substring(
                  matchIndex,
                  matchIndex + inputValue.length
                );
                const afterMatch = suggestion.value.substring(
                  matchIndex + inputValue.length
                );

                return (
                  <button
                    key={`${suggestion.type}-${index}`}
                    onClick={() => onSelect(suggestion.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#fbfcfe] dark:hover:bg-zinc-800 transition-colors group border-b border-slate-50 dark:border-zinc-800 last:border-0 text-xs"
                  >
                    <div className="shrink-0">{typeInfo.icon}</div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-playfair font-semibold text-slate-900 dark:text-white">
                        {matchIndex >= 0 ? (
                          <>
                            {beforeMatch}
                            <mark className="bg-blue-100 no-underline">{matchText}</mark>
                            {afterMatch}
                          </>
                        ) : (
                          suggestion.value
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{typeInfo.label}</p>
                    </div>
                    <Check className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}