"use client";
// src/components/SearchSuggestions.js
import { Search, Car, Tag, Check, MapPin } from "lucide-react";
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
    variant: { icon: <Tag className="w-4 h-4 text-slate-500" />, label: "Variant" },
    car: { icon: <Car className="w-4 h-4 text-green-600" />, label: "Car" },
  };

  // Separate cars from attributes
  const carSuggestions = suggestions.filter(s => s.type === "car");
  const attributeSuggestions = suggestions.filter(s => s.type !== "car");

  return (
    <div className={`absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-w-[340px] min-w-[220px] ${className}`} style={{fontSize:'13px'}}>
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-500">Searching suggestions...</span>
          </div>
        </div>
      ) : (
        <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
          {/* Cars Section */}
          {carSuggestions.length > 0 && (
            <>
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Available Cars
                </p>
              </div>
              {carSuggestions.map((car) => (
                <Link
                  key={`car-${car.id}`}
                  href={carListingPath(car)}
                  onClick={() => onClose?.()}
                  className="block px-3 py-2 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-0 group"
                  style={{fontSize:'13px'}}
                >
                  <div className="flex gap-2 items-center">
                    {/* Image */}
                    {car.image && (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
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
                        <h3 className="font-sans font-semibold text-slate-900 text-xs group-hover:text-[#ff5a2f] transition truncate">
                          {car.value}
                        </h3>
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

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        {car.location ? (
                          <>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{car.location}</span>
                          </>
                        ) : null}
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
                <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    Makes & Models
                  </p>
                </div>
              )}
              {attributeSuggestions.map((suggestion, index) => {
                const typeInfo =
                  suggestionTypes[suggestion.type] || {
                    icon: <Tag className="w-4 h-4 text-slate-500" />,
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
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors group border-b border-slate-200 last:border-0 text-xs"
                  >
                    <div className="shrink-0">{typeInfo.icon}</div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-sans font-semibold text-slate-900">
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
                      <p className="text-[11px] text-slate-500 mt-0.5">{typeInfo.label}</p>
                    </div>
                    <Check className="w-4 h-4 text-slate-500 group-hover:text-slate-500 shrink-0" />
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
