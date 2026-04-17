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
    make: { icon: <Tag className="w-4 h-4 text-#ff5a2f" />, label: "Make" },
    model: { icon: <Car className="w-4 h-4 text-amber-600" />, label: "Model" },
    variant: { icon: <Tag className="w-4 h-4 text-slate-400" />, label: "Variant" },
    car: { icon: <Car className="w-4 h-4 text-green-600" />, label: "Car" },
  };

  // Separate cars from attributes
  const carSuggestions = suggestions.filter(s => s.type === "car");
  const attributeSuggestions = suggestions.filter(s => s.type !== "car");

  return (
    <div className={`absolute left-0 right-0 top-full mt-2 bg-white border border-[#ddd4c8] rounded-none sm:rounded-none shadow-2xl z-50 overflow-hidden ${className}`}>
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
              <div className="px-4 sm:px-6 py-3 bg-[#fbfcfe] border-b border-[#ddd4c8]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Available Cars
                </p>
              </div>
              {carSuggestions.map((car) => (
                <Link
                  key={`car-${car.id}`}
                  href={`/cars/${car.id}`}
                  onClick={() => onClose?.()}
                  className="block px-4 sm:px-6 py-4 hover:bg-[#fbfcfe] transition-colors border-b border-slate-50 last:border-0 group"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    {car.image && (
                      <div className="w-16 h-16 rounded-none bg-slate-100 overflow-hidden flex-shrink-0">
                        <Image
                          src={car.image}
                          alt={car.value}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-#ff5a2f transition">
                          {car.value}
                        </h3>
                        {car.dealerVerified && (
                          <ShieldCheck className="w-4 h-4 text-#ff5a2f flex-shrink-0 mt-0.5" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-green-600">
                          {formatCarPrice(car)}
                        </p>
                        {car.mileage && (
                          <p className="text-xs text-slate-500">
                            {car.mileage.toLocaleString()} km
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
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
                <div className="px-4 sm:px-6 py-3 bg-[#fbfcfe] border-b border-[#ddd4c8]">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
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
                    className="w-full flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-3 hover:bg-[#fbfcfe] transition-colors group border-b border-slate-50 last:border-0"
                  >
                    <div className="shrink-0">{typeInfo.icon}</div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
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
                      <p className="text-xs text-slate-500 mt-0.5">{typeInfo.label}</p>
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