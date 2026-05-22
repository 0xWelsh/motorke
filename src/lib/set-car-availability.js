import { db } from "@/lib/db";
import { availabilityUpdateData } from "@/lib/car-sold-status";

export async function setCarAvailability(carId, available) {
  return db.car.update({
    where: { id: carId },
    data: availabilityUpdateData(available),
  });
}
