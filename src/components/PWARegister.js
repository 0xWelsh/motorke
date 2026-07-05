"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    // Register service worker for PWA/offline functionality
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered", reg);
        })
        .catch((err) => {
          console.error("[PWA] Service Worker registration failed:", err);
        });
    }

    // Prompt to install app on iOS when user visits from Safari
    let iosPwaPromptCount = localStorage.getItem("iosPwaPromptCount") || "0";
    iosPwaPromptCount = parseInt(iosPwaPromptCount, 10);

    if (iosPwaPromptCount < 2 && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Show banner after 10 seconds
      setTimeout(() => {
        const banner = document.createElement("div");
        banner.className =
          "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-[#2F855A] p-4 text-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]";
        banner.innerHTML = `
          <div class="min-w-0 flex-1 pr-2">
            <p class="text-sm font-semibold">Install BIDGARI</p>
            <p class="mt-0.5 text-xs text-white/90">Tap Share, then &quot;Add to Home Screen&quot;</p>
          </div>
          <button type="button" class="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25">Dismiss</button>
        `;
        const dismissBtn = banner.querySelector("button");
        dismissBtn?.addEventListener("click", () => {
          banner.remove();
          localStorage.setItem("iosPwaPromptCount", String(iosPwaPromptCount + 1));
        });
        document.body.appendChild(banner);
      }, 10000);
    }
  }, []);

  return null;
}
