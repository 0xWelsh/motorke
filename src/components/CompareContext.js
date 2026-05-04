"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CompareContext = createContext();

const COMPARE_STORAGE_KEY = "welsh-motorhub_compare";
const LEGACY_COMPARE_STORAGE_KEY = "welsh-motors_compare";

export function CompareProvider({ children }) {
  const [compareCars, setCompareCars] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved =
      localStorage.getItem(COMPARE_STORAGE_KEY) || localStorage.getItem(LEGACY_COMPARE_STORAGE_KEY);
    if (saved) {
      try {
        setCompareCars(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse compare cars from localStorage", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when compareCars changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareCars));
    }
  }, [compareCars, isInitialized]);

  const addToCompare = (car) => {
    setCompareCars((prev) => {
      // Limit to 3 cars (GSMArena style usually has 3-4, we'll stick to 3 for our UI)
      if (prev.length >= 3) {
        // notify user or just ignore? Let's replace the last one or just ignore.
        // For now, let's just not add if full, UI should handle disabled state.
        return prev;
      }
      if (prev.find((c) => c.id === car.id)) return prev;
      return [...prev, {
        id: car.id,
        year: car.year,
        make: car.make,
        model: car.model,
        price: car.price,
        image: car.image || car.images?.[0]?.url,
      }];
    });
  };

  const removeFromCompare = (carId) => {
    setCompareCars((prev) => prev.filter((c) => c.id !== carId));
  };

  const clearCompare = () => {
    setCompareCars([]);
  };

  const isInCompare = (carId) => {
    return compareCars.some((c) => c.id === carId);
  };

  return (
    <CompareContext.Provider value={{ 
      compareCars, 
      addToCompare, 
      removeFromCompare, 
      clearCompare, 
      isInCompare,
      isFull: compareCars.length >= 3,
      isInitialized
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
