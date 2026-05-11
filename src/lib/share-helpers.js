// src/lib/share-helpers.js
// Shared helpers for cross-platform sharing. Facebook in particular cannot
// accept a prefilled caption via URL (they removed the `quote` param to fight
// spam), so we copy the rich caption to clipboard and then open the FB
// sharer — the user pastes once and posts.

const FB_SHARER = "https://www.facebook.com/sharer/sharer.php";

export function buildFacebookSharerUrl(url) {
  if (!url) return null;
  return `${FB_SHARER}?u=${encodeURIComponent(url)}`;
}

/**
 * Open Facebook's sharer in a centered popup so the user stays on our page.
 * @returns {Window | null}
 */
export function openFacebookSharer(url) {
  if (typeof window === "undefined") return null;
  const sharer = buildFacebookSharerUrl(url);
  if (!sharer) return null;

  const w = 720;
  const h = 640;
  const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
  const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const height = window.innerHeight || document.documentElement.clientHeight || screen.height;
  const left = dualScreenLeft + Math.max(0, (width - w) / 2);
  const top = dualScreenTop + Math.max(0, (height - h) / 2);

  const popup = window.open(
    sharer,
    "wmh_fb_share",
    `popup=yes,width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`
  );
  if (!popup) {
    // Popup blocked — fall back to a full navigation in a new tab.
    window.open(sharer, "_blank", "noopener,noreferrer");
  }
  return popup;
}

/** Best-effort clipboard write that doesn't throw. */
export async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy */
  }
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand?.("copy");
    document.body.removeChild(ta);
    return Boolean(ok);
  } catch {
    return false;
  }
}

/**
 * Copy caption then open the FB sharer. Returns true if clipboard succeeded.
 */
export async function shareToFacebookWithCaption(url, caption) {
  const copied = await copyTextToClipboard(caption || "");
  openFacebookSharer(url);
  return copied;
}
