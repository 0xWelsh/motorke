// src/lib/search-alerts.js
import { db } from "@/lib/db";
import { notifyBuyerWatchlist } from "@/lib/whatsapp";
import { carListingPath } from "@/lib/car-listing-url";

/**
 * Matches a new or updated car against all active search alerts.
 * Dispatches WhatsApp notifications to matching buyers.
 */
export async function matchCarToSearchAlerts(carId) {
  try {
    const car = await db.car.findUnique({
      where: { id: carId },
      include: { dealer: true }
    });

    if (!car || !car.available) return;

    // Find all active alerts that match this car's specs
    const alerts = await db.searchAlert.findMany({
      where: {
        active: true,
        OR: [
          { make: null },
          { make: { equals: car.make, mode: 'insensitive' } }
        ],
        // Additional filters can be added here (model, price, year, etc.)
      }
    });

    const carTitle = `${car.year} ${car.make} ${car.model}`;
    const carUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://bidgari.com"}${carListingPath(car)}`;

    const notifications = [];

    for (const alert of alerts) {
      // Logic for more complex matching (price range, body type, etc.)
      let isMatch = true;

      if (alert.model && alert.model.toLowerCase() !== car.model.toLowerCase()) isMatch = false;
      if (alert.minPrice && car.price < alert.minPrice) isMatch = false;
      if (alert.maxPrice && car.price > alert.maxPrice) isMatch = false;
      if (alert.minYear && car.year < alert.minYear) isMatch = false;
      if (alert.bodyType && alert.bodyType !== car.bodyType) isMatch = false;

      if (isMatch) {
        notifications.push(
          notifyBuyerWatchlist(alert.phone, {
            carTitle,
            carUrl,
            updateType: "NEW_MATCH",
          }).then(() => {
            return db.searchAlert.update({
              where: { id: alert.id },
              data: { lastNotifiedAt: new Date() }
            });
          })
        );
      }
    }

    await Promise.allSettled(notifications);
    return notifications.length;

  } catch (error) {
    console.error("Search Alert Matching Error:", error);
  }
}

/**
 * Subscribes a phone number to a search alert.
 */
export async function subscribeToSearchAlert(data) {
  const { phone, make, model, minPrice, maxPrice, minYear, bodyType } = data;

  // Ensure we don't create duplicate alerts for the same phone + make/model
  const existing = await db.searchAlert.findFirst({
    where: { 
      phone, 
      make: make || null, 
      model: model || null,
      active: true 
    }
  });

  if (existing) return existing;

  return db.searchAlert.create({
    data: {
      phone,
      make: make || null,
      model: model || null,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      minYear: minYear ? parseInt(minYear) : null,
      bodyType: bodyType || null,
      active: true
    }
  });
}
