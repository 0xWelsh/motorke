"use client";

function getWindow() {
  if (typeof window === "undefined") return null;
  return window;
}

export function trackUiEvent(name, payload = {}) {
  const win = getWindow();
  if (!win || !name) return;

  try {
    if (typeof win.gtag === "function") {
      win.gtag("event", name, payload);
    }

    if (typeof win.plausible === "function") {
      win.plausible(name, { props: payload });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[analytics] trackUiEvent failed", error);
    }
  }

  try {
    const body = JSON.stringify({
      name,
      payload,
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
