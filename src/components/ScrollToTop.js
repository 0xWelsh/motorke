"use client";
import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSupportWhatsAppHref } from "@/lib/site-contact";

export default function ScrollToTop() {
  const pathname = usePathname() || "";
  const stackedAboveWhatsApp =
    pathname === "/" && Boolean(getSupportWhatsAppHref());
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
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
          className={`fixed z-40 w-12 h-12 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center animate-in fade-in ${
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
