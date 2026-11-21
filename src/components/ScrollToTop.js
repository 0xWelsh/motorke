"use client";
import { ArrowUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getSupportWhatsAppHref } from "@/lib/site-contact";
import { onGlobalPop } from "@/lib/back-nav";

export default function ScrollToTop() {
  const pathname = usePathname() || "";
  const stackedAboveWhatsApp =
    pathname === "/" && Boolean(getSupportWhatsAppHref());
  const [isVisible, setIsVisible] = useState(false);
  const lastPopPathRef = useRef(null);

  const toggleVisibility = () => {
    if (typeof window !== "undefined") {
      setIsVisible(window.scrollY > 300);
    }
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // `popstate` fires before the target route renders, so record the URL it
  // points to. The pathname effect below skips the forced scroll-to-top when
  // it matches (the router restores the previous scroll position instead).
  // Also feeds the module-level tracker used by CarsInfiniteGrid.
  useEffect(() => {
    const onPop = () => {
      lastPopPathRef.current = window.location.pathname + window.location.search;
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("popstate", onGlobalPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("popstate", onGlobalPop);
    };
  }, []);

  useEffect(() => {
    const here = `${window.location.pathname}${window.location.search}`;
    const wasBackForward = lastPopPathRef.current === here;
    lastPopPathRef.current = null;
    if (wasBackForward) return; // back/forward – let the router restore scroll
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`fixed z-40 w-12 h-12 bg-surface hover:bg-surface-overlay text-text rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center animate-in fade-in ${
            stackedAboveWhatsApp
              ? "bottom-[5.75rem] right-4 sm:bottom-[6.25rem] sm:right-6"
              : "bottom-8 right-8"
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </>
  );
}
