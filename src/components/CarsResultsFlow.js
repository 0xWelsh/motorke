"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CarCard from "@/components/CarCard";

export default function CarsResultsFlow({ cars, sidebarId = "cars-filter-sidebar" }) {
  const [fitCount, setFitCount] = useState(cars.length);
  const rootRef = useRef(null);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  const measureFitCount = useCallback(() => {
    if (typeof window === "undefined") return;

    // On smaller screens, the sidebar stacks above results; no split is needed.
    if (window.innerWidth < 1024) {
      setFitCount(cars.length);
      return;
    }

    const sidebar = document.getElementById(sidebarId);
    const cards = Array.from(rootRef.current?.querySelectorAll("[data-flow-card='true']") || []);
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
  }, [cars.length, sidebarId]);

  useEffect(() => {
    const scheduleMeasure = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      rafRef.current = requestAnimationFrame(measureFitCount);
      // Re-measure after deferred layout/content settles (fonts/images/sidebar state).
      timeoutRef.current = setTimeout(measureFitCount, 180);
    };

    const onResize = () => scheduleMeasure();
    window.addEventListener("resize", onResize);
    scheduleMeasure();

    const sidebar = document.getElementById(sidebarId);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleMeasure) : null;
    if (observer && sidebar) observer.observe(sidebar);
    if (observer && rootRef.current) observer.observe(rootRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      if (observer) observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [measureFitCount, sidebarId]);

  const topCars = useMemo(() => {
    if (fitCount === null) return cars;
    return cars.slice(0, fitCount);
  }, [cars, fitCount]);

  const bottomCars = useMemo(() => {
    if (fitCount === null) return [];
    return cars.slice(fitCount);
  }, [cars, fitCount]);

  return (
    <div ref={rootRef} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[2200px]:grid-cols-4 gap-4 justify-items-start">
        {topCars.map((car) => (
          <div key={`top-${car.id}`} data-flow-card="true" className="w-full max-w-[320px]">
            <CarCard car={car} distance={car.distanceValue ?? null} />
          </div>
        ))}
      </div>

      {bottomCars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-[2200px]:grid-cols-5 gap-4 justify-items-start">
          {bottomCars.map((car) => (
            <div key={`bottom-${car.id}`} className="w-full max-w-[320px]">
              <CarCard car={car} distance={car.distanceValue ?? null} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
