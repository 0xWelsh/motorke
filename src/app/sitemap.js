// src/app/sitemap.js
// Next.js generates /sitemap.xml automatically from this file

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSiteOrigin } from "@/lib/site-url";

const BASE = getSiteOrigin();

export default async function sitemap() {
  const [cars, dealers] = await Promise.all([
    db.car.findMany({
      where:   { available: true },
      select:  { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.dealer.findMany({
      select:  { slug: true, updatedAt: true },
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

  const carPages = cars.map((car) => ({
    url: `${BASE}/cars/${car.id}`,
    lastModified: car.updatedAt,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const dealerPages = dealers.map((dealer) => ({
    url: `${BASE}/dealers/${dealer.slug}`,
    lastModified: dealer.updatedAt,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticPages, ...carPages, ...dealerPages];
}
