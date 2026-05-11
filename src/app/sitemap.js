// src/app/sitemap.js
// Next.js generates /sitemap.xml automatically from this file.

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

const BASE = getSiteOrigin();

function toAbsImage(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
}

export default async function sitemap() {
  const carWhere = {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
  };
  const dealerWhere = PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {};

  const [cars, dealers] = await Promise.all([
    db.car.findMany({
      where: carWhere,
      select: {
        id: true,
        updatedAt: true,
        images: {
          orderBy: { order: "asc" },
          take: 4,
          select: { url: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.dealer.findMany({
      where: dealerWhere,
      select: { slug: true, updatedAt: true, logoUrl: true, bannerUrl: true },
    }),
  ]);

  const now = new Date();
  const staticPages = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/cars`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${BASE}/dealers`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.65 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/duty`, lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: `${BASE}/mission`, lastModified: now, changeFrequency: "yearly", priority: 0.35 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
  ];

  const carPages = cars.map((car) => {
    const images = (car.images || [])
      .map((img) => toAbsImage(img.url))
      .filter(Boolean);
    return {
      url: `${BASE}/cars/${car.id}`,
      lastModified: car.updatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
      ...(images.length ? { images } : {}),
    };
  });

  const dealerPages = dealers.map((dealer) => {
    const images = [toAbsImage(dealer.bannerUrl), toAbsImage(dealer.logoUrl)].filter(Boolean);
    return {
      url: `${BASE}/dealers/${dealer.slug}`,
      lastModified: dealer.updatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
      ...(images.length ? { images } : {}),
    };
  });

  return [...staticPages, ...carPages, ...dealerPages];
}
