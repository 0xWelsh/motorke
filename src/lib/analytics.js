"use client";

const ATTRIBUTION_KEY = "mk_attribution_v1";
const SESSION_KEY = "mk_session_id";
const FIRST_TOUCH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getWindow() {
  if (typeof window === "undefined") return null;
  return window;
}

function safeStorageGet(key) {
  const win = getWindow();
  if (!win) return null;
  try {
    return win.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  const win = getWindow();
  if (!win) return;
  try {
    win.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures silently.
  }
}

function buildSessionId() {
  const random = Math.random().toString(36).slice(2, 10);
  return `s_${Date.now().toString(36)}_${random}`;
}

function getOrCreateSessionId() {
  const win = getWindow();
  if (!win) return null;
  try {
    let id = win.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = buildSessionId();
      win.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function readAttribution() {
  const raw = safeStorageGet(ATTRIBUTION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.firstSeenAt || Date.now() - parsed.firstSeenAt > FIRST_TOUCH_TTL_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function captureAttributionFromLocation() {
  const win = getWindow();
  if (!win) return null;

  const url = new URL(win.location.href);
  const utmSource = url.searchParams.get("utm_source") || "";
  const utmMedium = url.searchParams.get("utm_medium") || "";
  const utmCampaign = url.searchParams.get("utm_campaign") || "";
  const utmContent = url.searchParams.get("utm_content") || "";
  const utmTerm = url.searchParams.get("utm_term") || "";

  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || utmContent || utmTerm);
  const existing = readAttribution();
  if (!hasUtm) return existing;

  const next = {
    utm_source: utmSource || existing?.utm_source || "direct",
    utm_medium: utmMedium || existing?.utm_medium || "none",
    utm_campaign: utmCampaign || existing?.utm_campaign || "none",
    utm_content: utmContent || existing?.utm_content || "",
    utm_term: utmTerm || existing?.utm_term || "",
    landing_path: existing?.landing_path || win.location.pathname || "/",
    firstSeenAt: existing?.firstSeenAt || Date.now(),
  };
  safeStorageSet(ATTRIBUTION_KEY, JSON.stringify(next));
  return next;
}

function detectDeviceType() {
  const win = getWindow();
  if (!win?.navigator) return undefined;
  const nav = win.navigator;
  // Modern Chromium exposes structured high-entropy hints.
  try {
    if (nav.userAgentData) {
      if (nav.userAgentData.mobile === true) return "mobile";
      const brand = nav.userAgentData.brands || [];
      if (brand.some((b) => /ipad|tablet/i.test(b.brand || ""))) return "tablet";
    }
  } catch {
    // fall through to UA sniffing
  }
  const ua = nav.userAgent || "";
  const isMobile =
    /Mobi|Android|iPhone|iPod|Opera Mini|IEMobile|BlackBerry|Windows Phone/i.test(ua) &&
    !/iPad/i.test(ua);
  if (isMobile) return "mobile";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  return "desktop";
}

function getTrackingContext() {
  const win = getWindow();
  if (!win) return {};
  const attribution = captureAttributionFromLocation() || readAttribution();
  const sessionId = getOrCreateSessionId();
  const deviceType = detectDeviceType();
  return {
    session_id: sessionId || undefined,
    utm_source: attribution?.utm_source || undefined,
    utm_medium: attribution?.utm_medium || undefined,
    utm_campaign: attribution?.utm_campaign || undefined,
    utm_content: attribution?.utm_content || undefined,
    utm_term: attribution?.utm_term || undefined,
    landing_path: attribution?.landing_path || undefined,
    device_type: deviceType,
    screen: win.screen ? `${win.screen.width}x${win.screen.height}` : undefined,
    ua: (win.navigator?.userAgent || "").slice(0, 180),
  };
}

export function trackUiEvent(name, payload = {}) {
  const win = getWindow();
  if (!win || !name) return;
  const enrichedPayload = {
    ...getTrackingContext(),
    ...payload,
  };

  try {
    if (typeof win.gtag === "function") {
      win.gtag("event", name, enrichedPayload);
    }

    if (typeof win.plausible === "function") {
      win.plausible(name, { props: enrichedPayload });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[analytics] trackUiEvent failed", error);
    }
  }

  try {
    const body = JSON.stringify({
      name,
      payload: enrichedPayload,
      source: "ui",
      path: win.location?.pathname || "/",
    });
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    // Intentionally silent: tracking must never break UX.
  }
}
