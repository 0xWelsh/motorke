// src/components/compare/CompareSearchModal.js
"use client";
import { X } from "lucide-react";
import Image from "next/image";
import { formatCarPrice } from "@/lib/utils";
import { getThumbnailUrl } from "@/lib/image-transform";

export default function CompareSearchModal({
  activeSlot,
  setActiveSlot,
  searchQuery,
  setSearchQuery,
  searchSlotError,
  setSearchSlotError,
  searchResults,
  loadingSearch,
  onAddCarSearch
}) {
  if (activeSlot === null) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm no-print"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        setActiveSlot(null);
        setSearchSlotError("");
        setSearchQuery("");
      }}
    >
      <div className="absolute inset-x-0 bottom-0 max-h-[82vh] bg-[#0f0f0f] border-t border-white/[0.06] p-4" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Add a car to compare</p>
          <button
            type="button"
            onClick={() => {
              setActiveSlot(null);
              setSearchSlotError("");
              setSearchQuery("");
            }}
            className="h-8 w-8 border border-white/[0.06] flex items-center justify-center text-zinc-300"
            style={{ borderRadius: "var(--radius)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Search make, model, year..."
          value={searchQuery}
          onChange={(e) => {
            setSearchSlotError("");
            setSearchQuery(e.target.value);
          }}
          className="w-full bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[var(--accent)]"
          style={{ borderRadius: "var(--radius)" }}
        />
        {searchSlotError && (
          <p className="mt-2 text-xs font-semibold text-red-400">{searchSlotError}</p>
        )}
        <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[56vh] pr-1">
          {searchResults.map((res) => (
            <button
              key={res.id}
              type="button"
              onClick={() => onAddCarSearch(res)}
              className="w-full flex items-center gap-3 p-3 border border-white/[0.06] hover:border-[var(--accent)]/40 text-left"
              style={{ borderRadius: "var(--radius)" }}
            >
              <div className="relative w-12 h-12 bg-white/[0.03] overflow-hidden border border-white/[0.06] shrink-0" style={{ borderRadius: "var(--radius)" }}>
                {res.image ? <Image src={getThumbnailUrl(res.image)} alt={res.model} fill className="object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{res.year} {res.make} {res.model}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{formatCarPrice(res)}</p>
              </div>
            </button>
          ))}
          {loadingSearch && (
            <div className="p-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Loading results...</div>
          )}
          {!loadingSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="p-4 text-[11px] font-semibold text-zinc-400 text-center">No matches yet. Try another make or model.</div>
          )}
        </div>
      </div>
    </div>
  );
}
