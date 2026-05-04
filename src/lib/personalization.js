"use client";

export const RECENT_STORAGE_KEY = "welsh-motorhub_recent";
export const LEGACY_RECENT_STORAGE_KEY = "welsh-motors_recent";

/** Migrate from legacy storage key once; keeps existing browsing history intact. */
export function readRecentCarsFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const curRaw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (curRaw) {
      const cur = JSON.parse(curRaw);
      if (Array.isArray(cur)) return cur;
    }
  } catch {
    // Fall through to legacy read.
  }
  try {
    const legRaw = localStorage.getItem(LEGACY_RECENT_STORAGE_KEY);
    const legacy = legRaw ? JSON.parse(legRaw) : [];
    if (Array.isArray(legacy) && legacy.length) {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(legacy));
    }
    return Array.isArray(legacy) ? legacy : [];
  } catch {
    return [];
  }
}
export const RECENT_COOKIE_KEY = "wm_recent";
export const COMPARE_SETS_KEY = "wm_compare_sets";

function encode(value) {
  return encodeURIComponent(value);
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function setCookie(name, value, maxAgeSeconds = 60 * 60 * 24 * 90) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encode(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function getCookie(name) {
  if (typeof document === "undefined") return "";
  const token = `${name}=`;
  const found = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(token));
  return found ? decode(found.slice(token.length)) : "";
}

export function readJsonCookie(name, fallback = null) {
  const raw = getCookie(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJsonCookie(name, value, maxAgeSeconds) {
  try {
    const json = JSON.stringify(value);
    setCookie(name, json, maxAgeSeconds);
  } catch {}
}
