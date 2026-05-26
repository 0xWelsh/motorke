"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND_HEADER_LOGO } from "@/lib/site-url";

export default function AuthBrandLogo({ href = "/", className = "", onDark = false }) {
  return (
    <Link href={href} className={`flex shrink-0 items-center ${className}`}>
      <div className="relative h-10 w-44 shrink-0 sm:h-11 sm:w-52">
        <Image
          src={BRAND_HEADER_LOGO}
          alt="Welsh Motorhub"
          fill
          className={`object-contain object-left ${onDark ? "invert" : "invert dark:invert-0"}`}
          priority
          sizes="(max-width: 640px) 176px, 208px"
        />
      </div>
    </Link>
  );
}
