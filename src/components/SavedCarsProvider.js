"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// One /api/saved round trip per session; every card heart reads from here.
const SavedCarsContext = createContext({
  loaded: false,
  isSaved: () => false,
  toggle: async () => {},
});

export function SavedCarsProvider({ children }) {
  const [ids, setIds] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/saved", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((data) => {
        if (cancelled) return;
        setIds(new Set(data.ids || []));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isSaved = useCallback((carId) => ids.has(carId), [ids]);

  // Returns true when the action needs a login (401) so the caller can
  // route to /login; state is already reconciled here.
  const toggle = useCallback(
    async (carId) => {
      const next = !ids.has(carId);
      setIds((prev) => {
        const s = new Set(prev);
        if (next) s.add(carId);
        else s.delete(carId);
        return s;
      });
      try {
        const res = await fetch(`/api/saved/${carId}`, {
          method: next ? "POST" : "DELETE",
          credentials: "include",
        });
        if (res.status === 401) {
          // roll back the optimistic flip; the caller decides navigation
          setIds((prev) => {
            const s = new Set(prev);
            if (next) s.delete(carId);
            else s.add(carId);
            return s;
          });
          return true;
        }
        const data = await res.json().catch(() => ({}));
        if (typeof data.saved === "boolean" && data.saved !== next) {
          setIds((prev) => {
            const s = new Set(prev);
            if (data.saved) s.add(carId);
            else s.delete(carId);
            return s;
          });
        }
      } catch {
        setIds((prev) => {
          const s = new Set(prev);
          if (next) s.delete(carId);
          else s.add(carId);
          return s;
        });
      }
      return false;
    },
    [ids],
  );

  return (
    <SavedCarsContext.Provider value={{ loaded, isSaved, toggle }}>
      {children}
    </SavedCarsContext.Provider>
  );
}

export function useSavedCars() {
  return useContext(SavedCarsContext);
}
