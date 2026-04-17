import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { computeLandedPriceForDb } from "@/lib/duty";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cars = await db.car.findMany();
    let updated = 0;
    
    for (const car of cars) {
      const computed = await computeLandedPriceForDb(
        car.price, 
        car.dutyPaid, 
        car.year, 
        car.engineCC, 
        car.fuelType
      );
      
      await db.car.update({
        where: { id: car.id },
        data: { computedLandedPrice: computed }
      });
      updated++;
    }
    
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
