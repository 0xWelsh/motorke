import { db } from "@/lib/db";

const DEFAULT_ADMIN_EMAIL = "11241welshmuhuri@gmail.com";

function guessImageType(url) {
  if (!url) return "image/png";
  const lower = url.toLowerCase();
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  if (lower.includes(".gif")) return "image/gif";
  return "image/png";
}

/** Public URL for the site icon (admin profile photo when set). */
export async function getBrandIconUrl() {
  const fromEnv = (process.env.BRAND_ICON_URL || process.env.ADMIN_AVATAR_URL || "").trim();
  if (fromEnv) return fromEnv;

  const adminEmail = (process.env.BRAND_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();

  try {
    const admin = await db.user.findFirst({
      where: {
        role: "ADMIN",
        active: true,
        avatarUrl: { not: null },
        email: { equals: adminEmail, mode: "insensitive" },
      },
      select: { avatarUrl: true },
    });

    const url = admin?.avatarUrl?.trim();
    return url || null;
  } catch {
    return null;
  }
}

export async function getBrandIconSource() {
  const url = await getBrandIconUrl();
  if (!url) return null;
  return { url, contentType: guessImageType(url) };
}

export const FALLBACK_BRAND_ICONS = {
  icon: [
    { url: "/favicon.png", type: "image/png", sizes: "96x96" },
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
};

export async function resolveBrandIcons() {
  const avatar = await getBrandIconUrl();
  if (!avatar) return FALLBACK_BRAND_ICONS;

  const type = guessImageType(avatar);
  return {
    icon: [
      { url: "/api/brand-icon", type: "image/png", sizes: "96x96" },
      { url: avatar, type, sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/api/brand-icon", sizes: "180x180", type: "image/png" }, { url: avatar, sizes: "180x180", type }],
  };
}
