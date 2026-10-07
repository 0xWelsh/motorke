"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildFacebookSharerUrl, copyTextToClipboardSync } from "@/lib/share-helpers";

export default function ShareButtons({
  listingUrl,
  browseUrl,
  title,
  price,
  dealerName,
  location,
  mileageLabel,
  photoUrl,
  sold = false,
}) {
  const [copied, setCopied] = useState(false);

  const listUrl = (listingUrl || "").trim();
  const metaLine = [mileageLabel, location].filter(Boolean).join(", ");
  const soldTag = sold ? "SOLD " : "";

  const shortText = `${soldTag}${title} — ${price}${metaLine ? ` (${metaLine})` : ""}${dealerName ? ` via ${dealerName}` : ""}`;
  const waText = encodeURIComponent(`${shortText}\n\n${listUrl}`);
  const tgText = encodeURIComponent(`${shortText}\n${listUrl}`);

  const supportsWebShare = typeof navigator !== "undefined" && !!navigator.share;

  async function handleNativeShare() {
    if (!listUrl) return;
    try {
      await navigator.share({ title: title || "BIDGARI", text: shortText, url: listUrl });
    } catch { /* user cancelled */ }
  }

  function canShareFiles() {
    if (typeof navigator === "undefined" || typeof File === "undefined") return false;
    if (typeof navigator.canShare !== "function") return false;
    try {
      return navigator.canShare({ files: [new File(["x"], "x.txt", { type: "text/plain" })] });
    } catch {
      return false;
    }
  }

  const blobRef = useRef(null);
  const blobFetchRef = useRef(false);

  // The photo blob is fetched ahead of the click (on hover/focus/idle) so that
  // clicking Share can hand the image to the share sheet synchronously. The old
  // version awaited fetch + .blob() inside the click handler, so nothing visible
  // happened for as long as the image took to download.
  const prefetchPhoto = useCallback(() => {
    if (blobFetchRef.current || blobRef.current) return;
    const photoSrc = (photoUrl || "").trim();
    if (!photoSrc || !canShareFiles()) return;
    blobFetchRef.current = true;
    fetch(photoSrc, { mode: "cors" })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob && blob.type && blob.type.startsWith("image/")) blobRef.current = blob;
      })
      .catch(() => {})
      .finally(() => {
        blobFetchRef.current = false;
      });
  }, [photoUrl]);

  useEffect(() => {
    // Warm it up while the user reads the page, without competing with LCP.
    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(prefetchPhoto, { timeout: 4000 })
        : window.setTimeout(prefetchPhoto, 2500);
    return () => {
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle);
      }
    };
  }, [prefetchPhoto]);

  function shareWhatsApp() {
    if (!listUrl) return;

    // Hot path: blob already warmed, so the share sheet opens this frame.
    const blob = blobRef.current;
    if (blob && canShareFiles()) {
      const type = blob.type || "image/jpeg";
      const ext = type.split("/")[1] === "jpeg" ? "jpg" : type.split("/")[1] || "jpg";
      const shareData = {
        files: [new File([blob], `bidgari-car.${ext}`, { type })],
        text: `${shortText}\n\n${listUrl}`,
        url: listUrl,
      };
      if (navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => {
          window.open(`https://wa.me/?text=${waText}`, "_blank", "noopener,noreferrer");
        });
        return;
      }
    }

    // Cold path: open WhatsApp now, don't wait on the network.
    window.open(`https://wa.me/?text=${waText}`, "_blank", "noopener,noreferrer");
  }

  function copyLink() {
    if (!listUrl) return;
    navigator.clipboard.writeText(listUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const fbCaption = [`${title}, ${price}`, metaLine || null, dealerName || null, "", "BIDGARI Verified car for sale."].filter(Boolean).join("\n");

  function shareFacebook() {
    // Copy the caption to the clipboard so the user can paste it into the
    // Facebook post. The sharer itself pulls the car's first image and
    // description from the page's OG tags (Facebook fetches those itself).
    copyTextToClipboardSync(fbCaption);
  }

  function shareInstagram() {
    // Instagram has no web post URL — open the native share sheet (which
    // includes Instagram) on phones, otherwise fall back to copy-link.
    if (typeof navigator !== "undefined" && !!navigator.share) {
      navigator
        .share({ title: title || "BIDGARI", text: shortText, url: listUrl })
        .catch(() => copyLink());
      return;
    }
    copyLink();
  }

  const iconClass = "btn btn-neutral btn-icon w-9 h-9";

  return (
    <div className="flex items-center gap-2.5">
      {supportsWebShare && (
        <button type="button" onClick={handleNativeShare} aria-label="Share"
          className={iconClass}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={shareWhatsApp}
        onPointerEnter={prefetchPhoto}
        onFocus={prefetchPhoto}
        aria-label="Share photo on WhatsApp"
        className="btn btn-success btn-icon w-9 h-9"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>

      <a href={`https://t.me/share/url?url=${encodeURIComponent(listUrl)}&text=${tgText}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"
        className={iconClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </a>

      <a href={buildFacebookSharerUrl(listUrl) || "#"} target="_blank" rel="noopener noreferrer" onClick={shareFacebook} aria-label="Share on Facebook"
        className={iconClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>

      <button type="button" onClick={shareInstagram} disabled={!listUrl} aria-label={copied ? "Copied" : "Share on Instagram"}
        className={iconClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      </button>

      <button type="button" onClick={copyLink} disabled={!listUrl} aria-label={copied ? "Copied" : "Copy link"}
        className={iconClass}>
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        )}
      </button>
    </div>
  );
}
