"use client";
// src/components/ShareButtons.js
// Web Share API (native share sheet) when available, with individual platform buttons as fallback.

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
 * @param {string|null} [props.previewImageUrl] Same-origin OG JPEG for clipboard image paste
 */
export default function ShareButtons({
  listingUrl,
  browseUrl,
  title,
  price,
  dealerName,
  location,
  mileageLabel,
  previewImageUrl,
}) {
  const [copied, setCopied] = useState(false);
  const [fbHint, setFbHint] = useState(null);

  const listUrl = (listingUrl || "").trim();
  const moreUrl = (browseUrl || "").trim();
  const metaLine = [mileageLabel, location].filter(Boolean).join(", ");

  const shortText = `${title} — ${price}${metaLine ? ` (${metaLine})` : ""}${dealerName ? ` via ${dealerName}` : ""}`;
  const waText = encodeURIComponent(`${shortText}\n\n${listUrl}`);
  const tgText = encodeURIComponent(`${shortText}\n${listUrl}`);

  const supportsWebShare = typeof navigator !== "undefined" && !!navigator.share;

  async function handleNativeShare() {
    if (!listUrl) return;
    try {
      await navigator.share({
        title: title || "WELSH",
        text: shortText,
        url: listUrl,
      });
    } catch {
      // user cancelled or API unavailable — do nothing
    }
  }

  function copyLink() {
    if (!listUrl) return;
    navigator.clipboard.writeText(listUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const fbCaptionLines = [
    `${title}, ${price}`,
    metaLine || null,
    dealerName || null,
    "",
    "Verified dealer car on WELSH.",
  ].filter(Boolean);
  const fbCaption = fbCaptionLines.join("\n");

  async function shareFacebook() {
    if (!listUrl) return;
    const result = await shareToFacebookWithCaption(listUrl, fbCaption, {
      imageUrl: previewImageUrl,
    });
    setFbHint(result.textCopied ? "ready" : "manual");
    setTimeout(() => setFbHint(null), 5000);
  }

  const fbButtonLabel =
    fbHint === "ready"
      ? "✓ Paste in Facebook"
      : fbHint === "manual"
        ? "Paste caption in FB"
        : "Share on Facebook";

  const btnBase =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap text-xs rounded-xl px-4 py-2.5 font-semibold transition-colors sm:flex-initial sm:rounded-2xl sm:py-2";

  return (
    <div className="flex w-full max-w-md flex-col gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
      {supportsWebShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className={`${btnBase} bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700`}
        >
          Share
        </button>
      )}

      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} bg-[#25D366]/12 border border-[#25D366]/25 text-[#128C3C] dark:text-[#25D366] hover:bg-[#25D366]/18`}
      >
        WhatsApp
      </a>

      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(listUrl)}&text=${tgText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} bg-[#0088CC]/12 border border-[#0088CC]/25 text-[#0088CC] hover:bg-[#0088CC]/18`}
      >
        Telegram
      </a>

      <button
        type="button"
        onClick={shareFacebook}
        disabled={!listUrl}
        className={`${btnBase} bg-[#1877F2]/12 border border-[#1877F2]/25 text-[#1877F2] hover:bg-[#1877F2]/18 disabled:opacity-50`}
      >
        {fbButtonLabel}
      </button>

      <button
        type="button"
        onClick={copyLink}
        disabled={!listUrl}
        className={`${btnBase} bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 text-slate-700 hover:text-slate-900 dark:text-white hover:bg-slate-100 disabled:opacity-50`}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
