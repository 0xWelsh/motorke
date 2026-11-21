"use client";

import Image from "next/image";
import { BRAND_HEADER_LOGO } from "@/lib/site-url";

/**
 * Theme-aware brand wordmark. The green logo is tuned for light surfaces;
 * the white one (logo-dark.png) is for dark surfaces. Visibility follows the
 * `dark` class next-themes puts on <html>, so no client-side theme read and
 * no hydration flash.
 */
export default function BrandLogo({
  className = "",
  priority,
  sizes,
}) {
  const base = "h-full w-auto object-contain object-left";
  return (
    <>
      <Image
        src={BRAND_HEADER_LOGO}
        alt="BIDGARI"
        priority={priority}
        sizes={sizes}
        width={1000}
        height={333}
        className={`${base} dark:hidden ${className}`}
      />
      <Image
        src="/logos/bidgari-logo-on-dark.png"
        alt="BIDGARI"
        priority={priority}
        sizes={sizes}
        width={1000}
        height={333}
        className={`hidden ${base} dark:block ${className}`}
      />
    </>
  );
}
