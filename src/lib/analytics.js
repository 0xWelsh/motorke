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
}
