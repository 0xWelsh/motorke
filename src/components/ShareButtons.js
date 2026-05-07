"use client";
// src/components/ShareButtons.js
// WhatsApp share + copy link — copy mirrors listing card cues; link preview image comes from OG on listingUrl.

import { useState } from "react";

/**
 * @param {object} props
 * @param {string} props.listingUrl Absolute URL to this car (OG preview + image).
 * @param {string} props.browseUrl Absolute URL to inventory (/cars).
 * @param {string} props.title Full listing title (e.g. "2020 Toyota Hilux ...").
 * @param {string} props.price Formatted price (e.g. "KSh …").
 * @param {string} [props.dealerName]
 * @param {string} [props.location]
 * @param {string|null} [props.mileageLabel] e.g. "45,000 km"
 */
export default function ShareButtons({
  listingUrl,
  browseUrl,
  title,
  price,
  dealerName,
  location,
  mileageLabel,
}) {
  const [copied, setCopied] = useState(false);

  const listUrl = (listingUrl || "").trim();
  const moreUrl = (browseUrl || "").trim();

  function copyLink() {
    if (!listUrl) return;
    navigator.clipboard.writeText(listUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const metaLine = [mileageLabel, location].filter(Boolean).join(" · ");
  const dealerLine = dealerName ? `via ${dealerName}` : "";

  const shareLines = [
    "WELSH MOTORHUB",
    "Kenya · verified dealer cars",
    "",
    listUrl,
    "",
    `▸ ${title}`,
    `▸ ${price}`,
    ...(metaLine ? [`▸ ${metaLine}`] : []),
    ...(dealerLine ? [`▸ ${dealerLine}`] : []),
    "",
    "Browse more verified stock:",
    moreUrl || listUrl,
  ];

  const waText = encodeURIComponent(shareLines.join("\n"));
  const waUrl = `https://wa.me/?text=${waText}`;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-[#25D366]/12 border border-[#25D366]/25 text-[#128C3C] dark:text-[#25D366] hover:bg-[#25D366]/18 rounded-2xl px-3 py-2 font-semibold transition-colors"
      >
        💬 Share on WhatsApp
      </a>
      <button
        type="button"
        onClick={copyLink}
        disabled={!listUrl}
        className="flex items-center gap-1.5 text-xs bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 text-slate-700 hover:text-slate-900 dark:text-white hover:bg-slate-100 rounded-2xl px-3 py-2 font-semibold transition-colors disabled:opacity-50"
      >
        {copied ? "✓ Copied!" : "🔗 Copy listing link"}
      </button>
    </div>
  );
}
