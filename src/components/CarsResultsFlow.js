"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import CarCard from "@/components/CarCard";

export default function CarsResultsFlow({ cars, sidebarId = "cars-filter-sidebar" }) {
  const [fitCount, setFitCount] = useState(null);

  useEffect(() => {
    const onResize = () => setFitCount(null);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    if (fitCount !== null) return;
    if (typeof window === "undefined") return;

    // On smaller screens, the sidebar stacks above results; no split is needed.
    if (window.innerWidth < 1024) {
      setFitCount(cars.length);
      return;
    }

    const sidebar = document.getElementById(sidebarId);
    const cards = Array.from(document.querySelectorAll("[data-flow-card='true']"));
    if (!sidebar || cards.length === 0) {
      setFitCount(cars.length);
      return;
    }

    const sidebarHeight = sidebar.getBoundingClientRect().height;
    const groups = new Map();

    cards.forEach((card, index) => {
      const top = Math.round(card.offsetTop);
      const height = card.getBoundingClientRect().height;
      const existing = groups.get(top) || { maxHeight: 0, lastIndex: index };
      existing.maxHeight = Math.max(existing.maxHeight, height);
      existing.lastIndex = index;
      groups.set(top, existing);
    });

    const sortedRows = Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([top, row]) => ({ top, ...row }));

    let lastFittingIndex = -1;
    for (const row of sortedRows) {
      const rowBottom = row.top + row.maxHeight;
      if (rowBottom <= sidebarHeight) {
        lastFittingIndex = Math.max(lastFittingIndex, row.lastIndex);
      } else {
        break;
      }
    }

    const nextFitCount = Math.max(0, lastFittingIndex + 1);
    setFitCount(nextFitCount);
  }, [cars, fitCount, sidebarId]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[2200px]:grid-cols-4 gap-4">
        {topCars.map((car) => (
          <div key={`top-${car.id}`} data-flow-card="true">
            <CarCard car={car} distance={car.distanceValue ?? null} />
          </div>
        ))}
      </div>

      {bottomCars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-[2200px]:grid-cols-5 gap-4">
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
