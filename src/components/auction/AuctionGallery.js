"use client";

import { useState } from "react";
import Image from "next/image";
import { absoluteMediaUrl } from "@/lib/site-url";

export default function AuctionGallery({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (!images.length) {
    return (
      <div className="relative aspect-[16/10] rounded-xl bg-[var(--surface-overlay)] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
          No images
        </div>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[var(--surface-overlay)]">
        <Image
          src={absoluteMediaUrl(activeImage.url)}
          alt={activeImage.alt || "Vehicle photo"}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 70vw"
        />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {images.map((img, idx) => (
          <button
            key={img.id || idx}
            onClick={() => setActiveIndex(idx)}
            className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
              idx === activeIndex
                ? "border-[var(--accent)]"
                : "border-transparent hover:border-[var(--border-strong)]"
            }`}
          >
            <Image
              src={absoluteMediaUrl(img.url)}
              alt=""
              fill
              className="object-cover"
              sizes="150px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
