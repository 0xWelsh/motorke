"use client";
import { usePathname } from "next/navigation";

// Remounts the routed content on pathname change with a short fade/slide-in,
// so client-side navigation feels instant and connected. Animation is pure CSS
// and disabled under prefers-reduced-motion. Search params alone don't retrigger.
export default function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}