"use client";
// src/components/SearchSuggestions.js
import { Search, Car, Tag, Check, ShieldCheck, MapPin } from "lucide-react";
import { formatCarPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { carListingPath } from "@/lib/car-listing-url";
import { getThumbnailUrl } from "@/lib/image-transform";

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
    variant: { icon: <Tag className="w-4 h-4 text-zinc-400" />, label: "Variant" },
    car: { icon: <Car className="w-4 h-4 text-green-600" />, label: "Car" },
  };

  // Separate cars from attributes
  const carSuggestions = suggestions.filter(s => s.type === "car");
  const attributeSuggestions = suggestions.filter(s => s.type !== "car");

  return (
    <div className={`absolute left-0 right-0 top-full mt-2 bg-[#1c1c1c] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden max-w-[340px] min-w-[220px] ${className}`} style={{fontSize:'13px'}}>
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-400">Searching suggestions...</span>
          </div>
        </div>
      ) : (
        <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
          {/* Cars Section */}
          {carSuggestions.length > 0 && (
            <>
              <div className="px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-400">
                  Available Cars
                </p>
              </div>
              {carSuggestions.map((car) => (
                <Link
                  key={`car-${car.id}`}
                  href={carListingPath(car)}
                  onClick={() => onClose?.()}
                  className="block px-3 py-2 hover:bg-white/[0.06] transition-colors border-b border-white/[0.06] last:border-0 group"
                  style={{fontSize:'13px'}}
                >
                  <div className="flex gap-2 items-center">
                    {/* Image */}
                    {car.image && (
                      <div className="w-10 h-10 rounded-lg bg-white/[0.06] overflow-hidden flex-shrink-0 border border-white/[0.08]">
                        <Image
                          src={getThumbnailUrl(car.image)}
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
                        <h3 className="font-sans font-semibold text-white text-xs group-hover:text-[#ff5a2f] transition truncate">
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
                          <p className="text-[11px] text-zinc-400">
                            {car.mileage.toLocaleString()} km
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
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
                <div className="px-4 sm:px-6 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-zinc-400">
                    Makes & Models
                  </p>
                </div>
              )}
              {attributeSuggestions.map((suggestion, index) => {
                const typeInfo =
                  suggestionTypes[suggestion.type] || {
                    icon: <Tag className="w-4 h-4 text-zinc-400" />,
                    label: "Result",
                  };

                // Highlight matching parts (if there's a non-empty input).
                // When inputValue is empty (e.g. recent searches dropdown), avoid rendering an empty <mark>.
                const hasInput = Boolean(String(inputValue || "").trim());
                const matchIndex = hasInput
                  ? suggestion.value.toLowerCase().indexOf(String(inputValue).toLowerCase())
                  : -1;
                const beforeMatch = hasInput ? suggestion.value.substring(0, matchIndex) : "";
                const matchText = hasInput
                  ? suggestion.value.substring(matchIndex, matchIndex + String(inputValue).length)
                  : "";
                const afterMatch = hasInput
                  ? suggestion.value.substring(matchIndex + String(inputValue).length)
                  : suggestion.value;

                return (
                  <button
                    key={`${suggestion.type}-${index}`}
                    type="button"
                    onClick={() => onSelect(suggestion.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.06] transition-colors group border-b border-white/[0.06] last:border-0 text-xs"
                  >
                    <div className="shrink-0">{typeInfo.icon}</div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-sans font-semibold text-white">
                        {hasInput && matchIndex >= 0 ? (
                          <>
                            {beforeMatch}
                            <mark className="bg-blue-500/20 text-blue-300 no-underline">{matchText}</mark>
                            {afterMatch}
                          </>
                        ) : (
                          suggestion.value
                        )}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{typeInfo.label}</p>
                    </div>
                    <Check className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 shrink-0" />
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
