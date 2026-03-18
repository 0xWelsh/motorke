// src/app/sitemap.js
// Next.js generates /sitemap.xml automatically from this file

import { db } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://motorke.co.ke";

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

  const staticPages = [
    { url: BASE,           lastModified: new Date(), priority: 1.0   },
    { url: `${BASE}/cars`, lastModified: new Date(), priority: 0.9   },
    { url: `${BASE}/dealers`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/compare`, lastModified: new Date(), priority: 0.6 },
  ];

  const carPages = cars.map((car) => ({
    url:          `${BASE}/cars/${car.id}`,
    lastModified: car.updatedAt,
    priority:     0.8,
  }));

  const dealerPages = dealers.map((dealer) => ({
    url:          `${BASE}/dealers/${dealer.slug}`,
    lastModified: dealer.updatedAt,
    priority:     0.7,
  }));

  return [...staticPages, ...carPages, ...dealerPages];
}
