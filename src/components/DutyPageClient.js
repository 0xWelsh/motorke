"use client";

import { useCallback, useState } from "react";
import DutyCalculator from "@/components/DutyCalculator";
import DutySimilarStock from "@/components/DutySimilarStock";
import DutyMatchingStockStrip from "@/components/DutyMatchingStockStrip";
import DutyTrustBar from "@/components/DutyTrustBar";
import DutySeoContent from "@/components/DutySeoContent";
import DutyPageHero from "@/components/DutyPageHero";
import DutyRelatedSearches from "@/components/DutyRelatedSearches";

export default function DutyPageClient({
  initialVehicle = null,
  initialEstimate = null,
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

  const handleVehicleChange = useCallback((vehicle) => {
    setStockFilter((prev) => {
      const next = vehicle?.make
        ? { make: vehicle.make, model: vehicle.model ?? null }
        : { make: null, model: null };
      if (prev.make === next.make && prev.model === next.model) return prev;
      return next;
    });
  }, []);

  return (
    <>
      {showHero && (
        <div className="pt-4 md:pt-6 duty-print-hide">
          <DutyPageHero />
        </div>
      )}

      <div className="home-shell pb-28 sm:pb-32">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12 items-start">
            <div
              id="duty-calculator"
              className="lg:col-span-8 min-w-0 scroll-mt-24"
            >
              <div
                className="rounded-[var(--radius)] border border-border bg-surface shadow-lg p-4 sm:p-5"
              >
                <DutyCalculator
                  initialVehicle={initialVehicle}
                  initialEstimate={initialEstimate}
                  pageSlug={pageSlug}
                  popularVehicles={popularVehicles}
                  onVehicleChange={handleVehicleChange}
                />
                <DutyMatchingStockStrip make={stockFilter.make} model={stockFilter.model} />
              </div>
            </div>
            <div className="lg:col-span-4 mt-8 lg:mt-0 lg:sticky lg:top-24 duty-print-hide">
              <DutySimilarStock make={stockFilter.make} model={stockFilter.model} />
            </div>
          </div>

          <div className="duty-print-hide">
            <DutyTrustBar lastUpdated={ratesLastUpdated} />
          </div>
          <div className="duty-print-hide">
            <DutySeoContent />
          </div>
          <div className="duty-print-hide">
            <DutyRelatedSearches vehicle={initialVehicle} />
          </div>
        </div>
      </div>
    </>
  );
}
