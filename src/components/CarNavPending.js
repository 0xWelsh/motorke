"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLinkStatus } from "next/link";

const CarNavPendingContext = createContext({ pending: false, setPending: () => {} });

export function CarNavPendingProvider({ children }) {
  const [pending, setPendingState] = useState(false);

  const setPending = useCallback((value) => {
    setPendingState(Boolean(value));
  }, []);

  const value = useMemo(() => ({ pending, setPending }), [pending, setPending]);

  return <CarNavPendingContext.Provider value={value}>{children}</CarNavPendingContext.Provider>;
}

export function useCarNavPending() {
  return useContext(CarNavPendingContext);
}

/**
 * Must be rendered *inside* a <Link>. Reports that link's navigation as
 * pending so the overlay can paint immediately.
 *
 * Without this there is a ~7s gap between the click and the route's
 * loading.js appearing — the browser stays on the old page doing nothing
 * visible, because App Router waits for the RSC response before swapping.
 */
export function CarNavPendingSignal() {
  const { pending } = useLinkStatus();
  const { setPending } = useCarNavPending();

  useEffect(() => {
    setPending(pending);
    return () => setPending(false);
  }, [pending, setPending]);

  return null;
}