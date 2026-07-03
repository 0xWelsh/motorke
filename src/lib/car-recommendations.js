import { db } from "@/lib/db";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

function median(values = []) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function normalizeCounter(items = []) {
  return items.reduce((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function distance(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(v))) return 9999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getPersonalizedRecommendations(userId, effectiveLat, effectiveLng, carSelectFields) {
  const views = await db.carView.findMany({
    where: { userId },
    select: {
      car: {
        select: {
          id: true,
          make: true,
          bodyType: true,
          fuelType: true,
          price: true,
          dealer: { select: { verified: true, county: true } },
        },
      },
    },
    orderBy: { viewedAt: "desc" },
    take: 20,
  });

  const recentCars = views.map((item) => item.car).filter(Boolean);
  if (!recentCars.length) return [];

  const makeCounts = normalizeCounter(recentCars.map((car) => car.make));
  const bodyCounts = normalizeCounter(recentCars.map((car) => car.bodyType));
  const fuelCounts = normalizeCounter(recentCars.map((car) => car.fuelType));
  const countyCounts = normalizeCounter(recentCars.map((car) => car.dealer?.county));
  const prices = recentCars
    .map((car) => Number(car.price))
    .filter((v) => Number.isFinite(v) && v > 0);
  const preferredPrice = median(prices);
  const verifiedViews = recentCars.filter((car) => car.dealer?.verified).length;
  const prefersVerified = verifiedViews / recentCars.length >= 0.55;
  const topMake = Object.keys(makeCounts).sort((a, b) => makeCounts[b] - makeCounts[a])[0];
  const topBody = Object.keys(bodyCounts).sort((a, b) => bodyCounts[b] - bodyCounts[a])[0];
  const topFuel = Object.keys(fuelCounts).sort((a, b) => fuelCounts[b] - fuelCounts[a])[0];
  const topCounty = Object.keys(countyCounts).sort((a, b) => countyCounts[b] - countyCounts[a])[0];

  const verifiedDealerWhere = PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {};

  const candidateCars = await db.car.findMany({
    where: {
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
      ...(prefersVerified
        ? { dealer: { ...verifiedDealerWhere, verified: true } }
        : {}),
      ...(topMake || topBody || topFuel || topCounty
        ? {
            OR: [
              ...(topMake ? [{ make: { equals: topMake, mode: "insensitive" } }] : []),
              ...(topBody ? [{ bodyType: topBody }] : []),
              ...(topFuel ? [{ fuelType: topFuel }] : []),
              ...(topCounty
                ? [{ dealer: { ...verifiedDealerWhere, county: { equals: topCounty, mode: "insensitive" } } }]
                : []),
            ],
          }
        : {}),
    },
    select: carSelectFields,
    orderBy: [{ createdAt: "desc" }],
    take: 36,
  });

  const scoreValue = (counts, key, maxWeight) => {
    if (!key || !counts[key]) return 0;
    return Math.min(maxWeight, counts[key] * maxWeight);
  };

  return candidateCars
    .map((car) => {
      const priceDistance =
        preferredPrice && Number.isFinite(car.price)
          ? Math.abs(Number(car.price) - preferredPrice) / Math.max(preferredPrice, 1)
          : 1;
      const priceScore = preferredPrice ? Math.max(0, 24 - Math.min(24, priceDistance * 100)) : 8;
      const countyScore = topCounty && car.dealer?.county === topCounty ? 10 : 0;
      const isNearUser =
        effectiveLat != null && effectiveLng != null && car.dealer?.lat != null && car.dealer?.lng != null;
      const distanceKm = isNearUser
        ? distance(effectiveLat, effectiveLng, car.dealer.lat, car.dealer.lng)
        : null;
      const distanceScore = distanceKm != null ? Math.max(0, 14 - Math.min(14, distanceKm)) : 0;
      const verifiedScore = prefersVerified && car.dealer?.verified ? 10 : car.dealer?.verified ? 5 : 0;
      const affinityScore =
        scoreValue(makeCounts, car.make, 28) +
        scoreValue(bodyCounts, car.bodyType, 18) +
        scoreValue(fuelCounts, car.fuelType, 12);
      const freshness = Math.max(0, 8 - Math.min(8, (Date.now() - new Date(car.createdAt).getTime()) / 86400000));
      const reasons = [];
      if (makeCounts[car.make] >= 2) reasons.push(`You often view ${car.make}`);
      if (car.bodyType && bodyCounts[car.bodyType] >= 2)
        reasons.push(`Matches your ${BODY_TYPE_LABELS[car.bodyType] || car.bodyType} preference`);
      if (car.fuelType && fuelCounts[car.fuelType] >= 2)
        reasons.push(`Fuel choice: ${FUEL_LABELS[car.fuelType] || car.fuelType}`);
      if (preferredPrice && priceDistance <= 0.18) reasons.push("Within your usual price range");
      if (topCounty && car.dealer?.county === topCounty) reasons.push(`Popular in ${topCounty} for you`);
      if (distanceKm != null && distanceKm <= 25) reasons.push("Near your location");
      if (prefersVerified && car.dealer?.verified) reasons.push("From a verified dealer you prefer");
      if (!reasons.length && car.dealer?.verified) reasons.push("From a verified dealer");
      if (!reasons.length) reasons.push("Aligned with your recent browsing");
      return {
        car,
        score: affinityScore + priceScore + countyScore + distanceScore + verifiedScore + freshness,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => ({
      ...item.car,
      recommendationReasons: item.reasons.slice(0, 2),
    }))
    .slice(0, 10);
}
