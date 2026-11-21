"use client";

import PictureImage from "@/components/PictureImage";

/**
 * Spotlight (FEATURED) card mosaic — Cars & Bids spotlight format:
 * one hero photo left (2/3 width, full height) + 2x2 thumb grid right.
 * Only paid spotlight listings with 2+ photos get this treatment;
 * everyone else keeps the single-photo card.
 */
export default function CardMosaic({ urls, alt, sizes, priority = false }) {
  const [main, ...rest] = urls;
  const thumbs = rest.slice(0, 4);

  return (
    <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 p-1">
      <div className="relative col-span-2 row-span-2 overflow-hidden rounded-lg bg-surface-overlay">
        <PictureImage
          src={main}
          alt={alt}
          priority={priority}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          sizes={sizes}
        />
      </div>
      {Array.from({ length: 4 }).map((_, i) =>
        thumbs[i] ? (
          <div key={i} className="relative overflow-hidden rounded-lg bg-surface-overlay">
            <PictureImage
              src={thumbs[i]}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              sizes="120px"
            />
          </div>
        ) : (
          <div key={i} className="rounded-lg bg-surface-overlay" aria-hidden />
        ),
      )}
    </div>
  );
}
