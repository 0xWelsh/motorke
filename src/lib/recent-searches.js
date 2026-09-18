// src/lib/recent-searches.js
// Shared helpers for "recent car searches" stored in localStorage. Multiple
// search surfaces (navbar mobile overlay, cars-page global search, quick
// actions) read/write the same key so previous searches follow the user.
export const RECENT_CAR_SEARCHES_KEY = "motorke:recent-car-searches";
const MAX_RECENT = 6;

export function loadRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_CAR_SEARCHES_KEY) || "[]";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.label === "string" && x.label.trim())
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function saveRecentSearch(label, query = "") {
  if (typeof window === "undefined") return;
  const labelTrim = String(label || "").trim();
  if (!labelTrim) return;
  try {
    const prev = loadRecentSearches();
    const entry = { label: labelTrim, query, createdAt: Date.now() };
    const deduped = [entry, ...prev.filter((item) => item.label !== labelTrim)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_CAR_SEARCHES_KEY, JSON.stringify(deduped));
  } catch {
    // localStorage disabled / quota – best-effort only
  }
}

// Shape compatible with the SearchSuggestions component.
export function toRecentSuggestionItems(items) {
  return items.map((it) => ({ type: "make", value: it.label }));
}
