"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AuctionHeader({ title, subtitle, backHref = "/auctions" }) {
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Auctions
      </Link>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-[var(--text-secondary)]">{subtitle}</p>
      )}
    </div>
  );
}
