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
          "fixed bottom-0 left-0 right-0 bg-[#ff5a2f] text-slate-900 p-4 flex items-center justify-between gap-4 z-50 animate-in slide-in-from-bottom";
        banner.innerHTML = `
          <div className="flex-1">
            <p className="font-semibold text-sm">Install Motorke</p>
            <p className="text-xs text-blue-100">Tap Share, then "Add to Home Screen"</p>
          </div>
          <button onclick="this.parentElement.remove(); localStorage.setItem('iosPwaPromptCount', '${iosPwaPromptCount + 1}');" class="text-sm font-semibold whitespace-nowrap">Dismiss</button>
        `;
        document.body.appendChild(banner);
      }, 10000);
    }
  }, []);

  return null;
}
