// src/lib/use-bottom-action-bar.js
"use client";
import { useEffect } from "react";

// Body class set while a page-level fixed bottom action bar is visible on
// mobile. CompareSelector watches this so its floating tray never overlaps
// the car-detail / compare / dealer / duty sticky bars.
export const BOTTOM_BAR_CLASS = "has-bottom-action-bar";

const MOBILE = "(max-width: 1023px)";

export function useBottomActionBar() {
  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const apply = () => document.body.classList.toggle(BOTTOM_BAR_CLASS, mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.classList.remove(BOTTOM_BAR_CLASS);
    };
  }, []);
}