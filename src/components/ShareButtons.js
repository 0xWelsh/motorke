"use client";
// src/components/ShareButtons.js
// WhatsApp share (pre-filled), Facebook share (caption copied to clipboard, sharer popup), and copy link.
// Facebook cannot accept a pre-filled caption via URL, so we copy a ready-to-paste caption
// to the clipboard and then open the FB composer — the user pastes once and posts.

import { useState } from "react";
import { shareToFacebookWithCaption } from "@/lib/share-helpers";

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
  const [fbHint, setFbHint] = useState(null); // "copied" | "manual" | null

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

  // Facebook caption — shorter, post-style, without the duplicated link
  // (Facebook will render the OG card from the URL it composes itself).
  const fbCaptionLines = [
    `${title} — ${price}`,
    metaLine || null,
    dealerLine || null,
    "",
    "Verified dealer car on Welsh Motorhub — Kenya's car marketplace.",
  ].filter(Boolean);
  const fbCaption = fbCaptionLines.join("\n");

  async function shareFacebook() {
    if (!listUrl) return;
    const copiedOk = await shareToFacebookWithCaption(listUrl, fbCaption);
    setFbHint(copiedOk ? "copied" : "manual");
    setTimeout(() => setFbHint(null), 4000);
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap text-xs bg-[#25D366]/12 border border-[#25D366]/25 text-[#128C3C] dark:text-[#25D366] hover:bg-[#25D366]/18 rounded-xl px-4 py-2.5 font-semibold transition-colors sm:flex-initial sm:rounded-2xl sm:py-2"
      >
        💬 Share on WhatsApp
      </a>
      <button
        type="button"
        onClick={shareFacebook}
        disabled={!listUrl}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap text-xs bg-[#1877F2]/12 border border-[#1877F2]/25 text-[#1877F2] hover:bg-[#1877F2]/18 rounded-xl px-4 py-2.5 font-semibold transition-colors disabled:opacity-50 sm:flex-initial sm:rounded-2xl sm:py-2"
        aria-label="Share on Facebook (caption auto-copied)"
        title="Caption is copied to your clipboard — paste it in the Facebook composer"
      >
        {fbHint === "copied"
          ? "✓ Caption copied — paste in FB"
          : fbHint === "manual"
            ? "Paste caption in FB"
            : "📘 Share on Facebook"}
      </button>
      <button
        type="button"
        onClick={copyLink}
        disabled={!listUrl}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap text-xs bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 text-slate-700 hover:text-slate-900 dark:text-white hover:bg-slate-100 rounded-xl px-4 py-2.5 font-semibold transition-colors disabled:opacity-50 sm:flex-initial sm:rounded-2xl sm:py-2"
      >
        {copied ? "✓ Copied!" : "🔗 Copy listing link"}
      </button>
    </div>
  );
}
