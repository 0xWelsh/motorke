// src/hooks/use-client-session.js
// Client-side auth detection so server pages can stay static/cacheable
// instead of reading the session cookie on every request.
"use client";

import { useEffect, useState } from "react";

const TTL_MS = 30000;

// A car detail page mounts three consumers of this hook (SiteChrome,
// ImageGallery, CarContactActions). Without a shared cache each one fired its
// own `cache: "no-store"` /api/auth/me request, and PageTransition remounts
// them on every navigation — so the same session was re-fetched several times
// per page view, delaying the buttons that depend on `user` being known.
let inflight = null;
let cached = null;
let cachedAt = 0;

function getSession({ force = false } = {}) {
  const fresh = cached && Date.now() - cachedAt < TTL_MS;
  if (!force && fresh) return Promise.resolve(cached);
  if (!force && inflight) return inflight;

  inflight = fetch("/api/auth/me", { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => ({ loading: false, user: data?.user || null }))
    .catch(() => ({ loading: false, user: null }))
    .then((result) => {
      cached = result;
      cachedAt = Date.now();
      inflight = null;
      return result;
    });

  return inflight;
}

/** Drop the cached session — call after login/logout so the UI updates at once. */
export function invalidateClientSession() {
  cached = null;
  cachedAt = 0;
}

export function useClientSession() {
  const [state, setState] = useState(() => cached || { loading: true, user: null });

  useEffect(() => {
    let active = true;
    getSession().then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}