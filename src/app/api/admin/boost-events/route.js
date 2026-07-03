// src/app/api/admin/boost-events/route.js
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    await requireSuperAdmin();

    const { count: rawCount } = await req.json();
    const count = parseInt(rawCount, 10);
    if (isNaN(count) || count < 1 || count > 50000) {
      return Response.json({ error: "Count must be between 1 and 50,000." }, { status: 400 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const batchSize = 100;
    let total = 0;

    for (let i = 0; i < count; i += batchSize) {
      const size = Math.min(batchSize, count - i);
      const data = Array.from({ length: size }, () => ({
        name: "page_view",
        createdAt: new Date(todayStart.getTime() + Math.random() * (now.getTime() - todayStart.getTime())),
      }));
      await db.marketingEvent.createMany({ data });
      total += size;
    }

    return Response.json({ success: true, message: `Added ${total} page_view events today.` });
  } catch (err) {
    console.error("boost-events error:", err);
    return Response.json({ error: "Failed to boost events." }, { status: 500 });
  }
}
