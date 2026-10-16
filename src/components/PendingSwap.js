"use client";

import { useCarNavPending } from "@/components/CarNavPending";

/**
 * Swaps the routed content for `fallback` the moment a car card navigation
 * starts, rather than waiting for the route's loading.js to appear.
 *
 * Sits inside PageTransition, so the navbar (SiteChrome) stays put and the
 * swap matches what loading.js renders — no layout jump when it takes over.
 *
 * Only fires when a CarNavPendingSignal is mounted, i.e. for car-card
 * navigation. Every other link renders children normally.
 */
export default function PendingSwap({ children, fallback }) {
  const { pending } = useCarNavPending();
  return pending ? fallback : children;
}