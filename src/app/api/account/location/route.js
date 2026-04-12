import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/account/location
 * Returns user's saved location if available
 */
export async function GET(request) {
  try {
    const user = await requireAuth();
    const userLocation = await db.user.findUnique({
      where: { id: user.id },
      select: { lat: true, lng: true },
    });

    return Response.json(userLocation);
  } catch (error) {
    console.error("Get location error:", error);
    return Response.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/location
 * Body: { lat: number, lng: number }
 * Updates buyer's saved location for nearby dealer searches
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    const { lat, lng } = await request.json();

    // Validate coordinates
    if (typeof lat !== "number" || typeof lng !== "number") {
      return Response.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return Response.json(
        { error: "Coordinates out of range" },
        { status: 400 }
      );
    }

    // Update user location
    const updated = await db.user.update({
      where: { id: user.id },
      data: { lat, lng },
      select: { id: true, lat: true, lng: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Location update error:", error);
    return Response.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
