"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import { trackUiEvent } from "@/lib/analytics";
import { shareToFacebookWithCaption } from "@/lib/share-helpers";

/**
 * @param {{ showroomUrl: string; dealerName: string; stockCount?: number; location?: string; layout?: "stacked" | "mobileBar"; previewImageUrl?: string | null }} props
 */
export default function DealerShowroomShare({
  showroomUrl,
  dealerName,
  stockCount = 0,
  location,
  layout = "stacked",
  previewImageUrl = null,
}) {
  const [copied, setCopied] = useState(false);
  const [fbHint, setFbHint] = useState(null); // "ready" | "manual" | null

  const url = (showroomUrl || "").trim();
  const meta = [stockCount ? `${stockCount} cars in stock` : null, location].filter(Boolean).join(", ");
  const shareTitle = `${dealerName} | WELSH showroom`;

  const shortText = `${dealerName} — verified showroom${meta ? ` (${meta})` : ""} on WELSH.`;

  const fbCaption = [
    `${dealerName}, verified showroom on WELSH.`,
    meta || null,
    "",
    "Tap to browse the live inventory and contact the dealer directly.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  function emitShare(kind) {
    trackUiEvent("share_dealer_showroom", {
      dealer_name: dealerName,
      showroom_url: url,
      kind,
    });
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      emitShare("copy");
    } catch {
      /* noop */
    }
  }

  async function shareNative() {
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: meta ? `${shareTitle}${meta ? `, ${meta}` : ""}` : shareTitle,
          url,
        });
        emitShare("native");
      } catch {
        /* aborted or unsupported */
      }
      return;
    }
    await copyLink();
  }

  async function shareFacebook() {
    if (!url) return;
    const result = await shareToFacebookWithCaption(url, fbCaption, {
      imageUrl: previewImageUrl,
    });
    setFbHint(result.textCopied ? "ready" : "manual");
    setTimeout(() => setFbHint(null), 5000);
    emitShare("facebook");
  }

  const fbButtonLabel =
    fbHint === "ready"
      ? "Paste in Facebook"
      : fbHint === "manual"
        ? "Paste caption in FB"
        : "Facebook";

  const waText = encodeURIComponent(`${shortText}\n\n${url}`);
  const waUrl = `https://wa.me/?text=${waText}`;
  const tgText = encodeURIComponent(`${shortText}\n${url}`);

  if (layout === "mobileBar") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => shareNative()}
          disabled={!url}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-3.5 text-center text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 border border-slate-200 dark:border-slate-700"
          style={{ borderRadius: "var(--radius)" }}
        >
          <Share2 className="w-4 h-4 shrink-0" aria-hidden />
          {copied ? "Link copied" : "Share"}
        </button>
        <button
          type="button"
          onClick={() => shareFacebook()}
          disabled={!url}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1877F2]/12 border border-[#1877F2]/30 text-[#1877F2] py-3.5 text-center text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
          style={{ borderRadius: "var(--radius)" }}
          title="Caption copies to clipboard — tap Paste in Facebook"
        >
          <FaFacebookF className="w-4 h-4 shrink-0" aria-hidden />
          {fbHint === "ready" ? "Paste in FB" : fbHint === "manual" ? "Paste caption" : "Facebook"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Share showroom</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => shareNative()}
          disabled={!url}
          className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          style={{ borderRadius: "10px" }}
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Share link
        </button>
        <button
          type="button"
          onClick={() => copyLink()}
          disabled={!url}
          className="w-full inline-flex items-center justify-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          style={{ borderRadius: "10px" }}
        >
          {copied ? "Copied!" : "Copy showroom URL"}
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => emitShare("whatsapp")}
          className="w-full inline-flex items-center justify-center bg-[#25D366]/12 border border-[#25D366]/30 text-[#128C3C] dark:text-[#25D366] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] hover:bg-[#25D366]/18 transition-colors"
          style={{ borderRadius: "10px" }}
        >
          WhatsApp
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${tgText}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => emitShare("telegram")}
          className="w-full inline-flex items-center justify-center bg-[#0088CC]/12 border border-[#0088CC]/25 text-[#0088CC] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] hover:bg-[#0088CC]/18 transition-colors"
          style={{ borderRadius: "10px" }}
        >
          Telegram
        </a>
        <button
          type="button"
          onClick={() => shareFacebook()}
          disabled={!url}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1877F2]/12 border border-[#1877F2]/30 text-[#1877F2] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] hover:bg-[#1877F2]/18 transition-colors disabled:opacity-50"
          style={{ borderRadius: "10px" }}
          title="Caption copies to your clipboard — tap Paste in Facebook"
        >
          <FaFacebookF className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {fbButtonLabel}
        </button>
      </div>
    </div>
  );
}
