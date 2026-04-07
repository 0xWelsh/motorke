"use client";
// src/components/SearchSuggestions.js
import { Search, Car, Tag, Check } from "lucide-react";

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
    make: { icon: <Tag className="w-4 h-4 text-[var(--brand)]" />, label: "Make" },
    model: { icon: <Car className="w-4 h-4 text-[var(--brand-accent)]" />, label: "Model" },
    variant: { icon: <Tag className="w-4 h-4 text-slate-400" />, label: "Variant" },
  };

  return (
    <div className={`absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden ${className}`}>
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">Searching suggestions...</span>
          </div>
        </div>
      ) : (
        <div className="max-h-[65vh] sm:max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const typeInfo = suggestionTypes[suggestion.type] || { icon: <Tag className="w-4 h-4 text-slate-400" />, label: "Result" };
            
            // Highlight matching parts
            const matchIndex = suggestion.value.toLowerCase().indexOf(inputValue.toLowerCase());
            const beforeMatch = suggestion.value.substring(0, matchIndex);
            const matchText = suggestion.value.substring(matchIndex, matchIndex + inputValue.length);
            const afterMatch = suggestion.value.substring(matchIndex + inputValue.length);

            return (
              <button
                key={`${suggestion.type}-${index}`}
                onClick={() => onSelect(suggestion.value)}
                className="w-full flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-3 hover:bg-slate-50 transition-colors duration-200 group border-b border-slate-50 last:border-0"
              >
                <div className="shrink-0">
                  {typeInfo.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-[var(--brand)] transition-colors">
                    {beforeMatch}
                    <span className="text-[var(--brand-accent)]">{matchText}</span>
                    {afterMatch}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    {typeInfo.label}
                  </div>
                </div>
                <div className="shrink-0 text-slate-400 group-hover:text-[var(--brand-accent)] transition-colors">
                  <Check className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}