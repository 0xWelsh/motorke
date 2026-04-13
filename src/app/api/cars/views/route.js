// src/app/api/cars/views/route.js
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req) {
  try {
    const { carId } = await req.json();
    if (!carId) return Response.json({ error: "carId required" }, { status: 400 });

    // Get session (user is optional - anonymous users can also view)
    const session = await getSession();
    const userId = session?.user?.id || null;

    // Record the view
    await db.carView.create({
      data: {
        carId,
        userId,
        source: "web",
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to track car view:", error);
    return Response.json({ error: "Failed to track view" }, { status: 500 });
  }
}
