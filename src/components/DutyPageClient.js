"use client";

import { useState } from "react";
import DutyCalculator from "@/components/DutyCalculator";
import DutySimilarStock from "@/components/DutySimilarStock";

export default function DutyPageClient({ initialVehicle = null, pageSlug = null }) {
  const [stockFilter, setStockFilter] = useState(() =>
    initialVehicle
      ? { make: initialVehicle.make, model: initialVehicle.model }
      : { make: null, model: null },
  );

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12 items-start">
      <div className="lg:col-span-8 min-w-0">
        <DutyCalculator
          initialVehicle={initialVehicle}
          pageSlug={pageSlug}
          onVehicleChange={(vehicle) => {
            if (vehicle?.make) {
              setStockFilter({ make: vehicle.make, model: vehicle.model });
            } else {
              setStockFilter({ make: null, model: null });
            }
          }}
        />
      </div>
      <div className="lg:col-span-4 mt-10 lg:mt-0 lg:sticky lg:top-24">
        <DutySimilarStock make={stockFilter.make} model={stockFilter.model} />
      </div>
    </div>
  );
}
