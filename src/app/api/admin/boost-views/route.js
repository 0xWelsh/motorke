// src/app/api/admin/boost-views/route.js
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    await requireSuperAdmin();

    const { mode, value } = await req.json();

    if (mode === "multiply") {
      const multiplier = parseInt(value, 10);
      if (isNaN(multiplier) || multiplier < 1) {
        return Response.json({ error: "Multiplier must be a positive number." }, { status: 400 });
      }

      const cars = await db.car.findMany({
        select: { id: true, views: true },
      });

      for (const car of cars) {
        await db.car.update({
          where: { id: car.id },
          data: { views: Math.max(1, car.views * multiplier) },
        });
      }

      return Response.json({ success: true, message: `${cars.length} cars multiplied by ${multiplier}x.` });
    }

    if (mode === "floor") {
      const floor = parseInt(value, 10);
      if (isNaN(floor) || floor < 0) {
        return Response.json({ error: "Floor must be a non-negative number." }, { status: 400 });
      }

      const result = await db.car.updateMany({
        where: { views: { lt: floor } },
        data: { views: floor },
      });

      return Response.json({ success: true, message: `${result.count} cars set to minimum ${floor} views.` });
    }

    if (mode === "add") {
      const amount = parseInt(value, 10);
      if (isNaN(amount) || amount < 0) {
        return Response.json({ error: "Amount must be a non-negative number." }, { status: 400 });
      }

      const result = await db.car.updateMany({
        data: { views: { increment: amount } },
      });

      return Response.json({ success: true, message: `Added ${amount} views to ${result.count} cars.` });
    }

    return Response.json({ error: 'Mode must be "multiply", "floor", or "add".' }, { status: 400 });
  } catch (err) {
    console.error("boost-views error:", err);
    return Response.json({ error: "Failed to boost views." }, { status: 500 });
  }
}
