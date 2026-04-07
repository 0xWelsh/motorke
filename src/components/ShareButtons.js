"use client";
// src/components/ShareButtons.js
// WhatsApp share + copy link for car detail pages

import { useState, useEffect } from "react";

export default function ShareButtons({ title, price }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl]     = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const waText = encodeURIComponent(
    `Check out this car on Motorke 🚗\n${title} — ${price}\n${url}`
  );
  const waUrl = `https://wa.me/?text=${waText}`;

  return (
    <div className="flex gap-2">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg px-3 py-2 transition-colors"
      >
        💬 Share on WhatsApp
      </a>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
      >
        {copied ? "✓ Copied!" : "🔗 Copy link"}
      </button>
    </div>
  );
}
