import { db } from "@/lib/db";
import { calculateDistance } from "@/lib/geolocation";

/**
 * GET /api/dealers/nearby
 * Query: ?lat=latitude&lng=longitude&radius=50&county=optional
 * Returns array of dealers with distance, sorted by distance ascending
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userLat = parseFloat(searchParams.get("lat"));
    const userLng = parseFloat(searchParams.get("lng"));
    const radius = parseFloat(searchParams.get("radius")) || 50; // km, default 50
    const county = searchParams.get("county");

    // Validate required params
    if (isNaN(userLat) || isNaN(userLng)) {
      return Response.json(
        { error: "Missing or invalid lat/lng coordinates" },
        { status: 400 }
      );
    }

    // Fetch dealers, optionally filter by county
    let query = {
      where: {
        AND: [
          { lat: { not: null } },
          { lng: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        county: true,
        lat: true,
        lng: true,
        verified: true,
        _count: { select: { cars: true } },
      },
    };

    // Add county filter if provided
    if (county) {
      query.where.AND.push({ county: county });
    }

    const dealers = await db.dealer.findMany(query);

    // Calculate distance and filter by radius
    const dealersWithDistance = dealers
      .map((dealer) => ({
        ...dealer,
        distance: calculateDistance(
          userLat,
          userLng,
          dealer.lat,
          dealer.lng
        ),
      }))
      .filter((dealer) => dealer.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return Response.json(dealersWithDistance);
  } catch (error) {
    console.error("Nearby dealers error:", error);
    return Response.json(
      { error: "Failed to fetch nearby dealers" },
      { status: 500 }
    );
  }
}
