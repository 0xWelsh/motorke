// src/lib/share-helpers.js
// Facebook cannot pre-fill captions via URL. We copy caption (and listing
// preview image when possible) to the clipboard, then open the FB sharer.
// Mobile browsers need sync copy + re-copy on page hide so paste still works.

const FB_SHARER = "https://www.facebook.com/sharer/sharer.php";

export function buildFacebookSharerUrl(url) {
  if (!url) return null;
  return `${FB_SHARER}?u=${encodeURIComponent(url)}`;
}

/** True for phones / tablets where popup sharers and async clipboard are unreliable. */
export function isMobileShareEnvironment() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)) return true;
  return navigator.maxTouchPoints > 1 && window.innerWidth < 1024;
}

/**
 * Synchronous clipboard write — must run in the same user-gesture turn on iOS.
 * @returns {boolean}
 */
export function copyTextToClipboardSync(text) {
  if (!text || typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "0";
    ta.style.top = "0";
    ta.style.width = "2em";
    ta.style.height = "2em";
    ta.style.padding = "0";
    ta.style.border = "none";
    ta.style.outline = "none";
    ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand?.("copy");
    document.body.removeChild(ta);
    return Boolean(ok);
  } catch {
    return false;
  }
}

/** Best-effort async clipboard write that does not throw. */
export async function copyTextToClipboard(text) {
  if (!text) return false;
  if (copyTextToClipboardSync(text)) return true;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

/**
 * iOS often drops async clipboard when switching to Facebook — re-copy on hide.
 * @param {string} text
 * @param {number} [ttlMs]
 */
export function armClipboardRefreshOnPageHide(text, ttlMs = 12000) {
  if (!text || typeof document === "undefined") return () => {};
  const handler = () => {
    if (document.visibilityState === "hidden") {
      copyTextToClipboardSync(text);
    }
  };
  document.addEventListener("visibilitychange", handler);
  const timer = setTimeout(() => {
    document.removeEventListener("visibilitychange", handler);
  }, ttlMs);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", handler);
  };
}

/**
 * Copy caption + optional preview image (same-origin URLs work best).
 * @param {{ text: string, imageUrl?: string | null }} payload
 * @returns {Promise<{ textCopied: boolean, imageCopied: boolean }>}
 */
/**
 * Attach listing preview JPEG to clipboard (same-origin `/api/.../og-image` URLs).
 * @param {string} imageUrl
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyShareImageToClipboard(imageUrl, text) {
  const imgUrl = (imageUrl || "").trim();
  if (
    !imgUrl ||
    typeof navigator === "undefined" ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    return false;
  }
  try {
    const res = await fetch(imgUrl, { credentials: "same-origin" });
    if (!res.ok) return false;
    const blob = await res.blob();
    const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const textBlob = new Blob([text || ""], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        [type]: blob,
        "text/plain": textBlob,
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy caption + optional preview image (same-origin URLs work best).
 * @param {{ text: string, imageUrl?: string | null }} payload
 * @returns {Promise<{ textCopied: boolean, imageCopied: boolean }>}
 */
export async function copyRichShareToClipboard({ text, imageUrl }) {
  let textCopied = copyTextToClipboardSync(text);
  let imageCopied = false;

  const imgUrl = (imageUrl || "").trim();
  if (imgUrl) {
    imageCopied = await copyShareImageToClipboard(imgUrl, text);
    if (imageCopied) textCopied = true;
  }

  if (!textCopied) {
    textCopied = await copyTextToClipboard(text);
  }

  return { textCopied, imageCopied };
}

function waitMs(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Open Facebook's sharer in a centered popup (desktop).
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
    window.open(sharer, "_blank", "noopener,noreferrer");
  }
  return popup;
}

/** Mobile-friendly open (anchor click beats popup blockers). */
export function openFacebookSharerForDevice(url) {
  if (typeof window === "undefined") return null;
  const sharer = buildFacebookSharerUrl(url);
  if (!sharer) return null;

  if (isMobileShareEnvironment()) {
    const a = document.createElement("a");
    a.href = sharer;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return null;
  }

  return openFacebookSharer(url);
}

/**
 * Copy caption (and image when possible) then open the FB sharer.
 * @param {string} url
 * @param {string} caption
 * @param {{ imageUrl?: string | null }} [options]
 * @returns {Promise<{ textCopied: boolean, imageCopied: boolean, mobile: boolean }>}
 */
export async function shareToFacebookWithCaption(url, caption, options = {}) {
  const text = caption || "";
  const mobile = isMobileShareEnvironment();
  const imageUrl = (options.imageUrl || "").trim() || null;

  let textCopied = false;
  let imageCopied = false;

  if (mobile) {
    // Sync text in the tap gesture — iOS drops async clipboard after app switch.
    textCopied = copyTextToClipboardSync(text);
    armClipboardRefreshOnPageHide(text);

    if (imageUrl) {
      const imageRace = copyShareImageToClipboard(imageUrl, text);
      imageCopied = await Promise.race([imageRace, waitMs(280).then(() => false)]);
      if (imageCopied) textCopied = true;
    }

    if (!textCopied) {
      textCopied = await copyTextToClipboard(text);
    }

    openFacebookSharerForDevice(url);
  } else {
    const rich = await copyRichShareToClipboard({ text, imageUrl });
    textCopied = rich.textCopied;
    imageCopied = rich.imageCopied;
    openFacebookSharerForDevice(url);
  }

  return { textCopied, imageCopied, mobile };
}
