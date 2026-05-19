"use client";

import { useState } from "react";
import DutyCalculator from "@/components/DutyCalculator";
import DutySimilarStock from "@/components/DutySimilarStock";
import DutyTrustBar from "@/components/DutyTrustBar";
import DutySeoContent from "@/components/DutySeoContent";
import DutyPageHero from "@/components/DutyPageHero";

export default function DutyPageClient({
  initialVehicle = null,
  pageSlug = null,
  popularVehicles = [],
  ratesLastUpdated = null,
  showHero = true,
}) {
  const [stockFilter, setStockFilter] = useState(() =>
    initialVehicle
      ? { make: initialVehicle.make, model: initialVehicle.model }
      : { make: null, model: null },
  );

  return (
    <>
      {showHero && (
        <div className="pt-16 md:pt-20">
          <DutyPageHero />
        </div>
      )}

      <div className="home-shell pb-28 sm:pb-32">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12 items-start">
            <div className="lg:col-span-8 min-w-0 -mt-4 sm:-mt-6">
              <DutyCalculator
                initialVehicle={initialVehicle}
                pageSlug={pageSlug}
                popularVehicles={popularVehicles}
                onVehicleChange={(vehicle) => {
                  if (vehicle?.make) {
                    setStockFilter({ make: vehicle.make, model: vehicle.model });
                  } else {
                    setStockFilter({ make: null, model: null });
                  }
                }}
              />
            </div>
            <div className="lg:col-span-4 mt-8 lg:mt-0 lg:sticky lg:top-24">
              <DutySimilarStock make={stockFilter.make} model={stockFilter.model} />
            </div>
          </div>

          <DutyTrustBar lastUpdated={ratesLastUpdated} />
          <DutySeoContent />
        </div>
      </div>
    </>
  );
}
