"use client";

import { useEffect, useMemo, useState } from "react";
import CarCard from "@/components/CarCard";

export default function CarsResultsFlow({ cars, sidebarId = "cars-filter-sidebar" }) {
  const [fitCount, setFitCount] = useState(cars.length);

  useEffect(() => {
    const updateFixedSplit = () => {
      if (window.innerWidth < 1024) {
        setFitCount(cars.length);
        return;
      }
      const topCols = window.innerWidth >= 2200 ? 4 : 3;
      const topRows = 2;
      setFitCount(Math.min(cars.length, topCols * topRows));
    };

    const onResize = () => updateFixedSplit();
    window.addEventListener("resize", onResize);
    updateFixedSplit();

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [cars.length, sidebarId]);

  const topCars = useMemo(() => {
    if (fitCount === null) return cars;
    return cars.slice(0, fitCount);
  }, [cars, fitCount]);

  const bottomCars = useMemo(() => {
    if (fitCount === null) return [];
    return cars.slice(fitCount);
  }, [cars, fitCount]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8">
        {topCars.map((car, index) => (
          <div key={`top-${car.id}`} data-flow-card="true">
            <CarCard car={car} distance={car.distanceValue ?? null} priority={index < 2} />
          </div>
        ))}
      </div>

      {bottomCars.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8">
          {bottomCars.map((car) => (
            <div key={`bottom-${car.id}`}>
              <CarCard car={car} distance={car.distanceValue ?? null} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
