import Link from "next/link";
import { BODY_TYPES } from "@/lib/browse-catalog";

const SHAPE_KEYS = ["SEDAN", "HATCHBACK", "SUV", "PICKUP", "COUPE", "MINIVAN", "WAGON", "TRUCK"];

const SHAPES = SHAPE_KEYS.map((value) => BODY_TYPES.find((b) => b.value === value)).filter(Boolean);

/**
 * Nikkyo-style "Search by Shape" 4-column icon grid that deep-links into
 * the /cars listing filtered by body type.
 */
export default function HomepageShapeGrid({ heading = "Search by Shape" }) {
  if (!SHAPES.length) return null;

  return (
    <section aria-labelledby="shape-grid-heading" className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3 border-b-2 border-[var(--accent)] pb-1.5">
        <h2
          id="shape-grid-heading"
          className="text-sm font-black uppercase tracking-wider text-slate-900 sm:text-base"
        >
          {heading}
        </h2>
        <Link
          href="/cars"
          className="inline-flex shrink-0 items-center gap-1 rounded bg-[#d9534f] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#c9302c]"
        >
          More
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {SHAPES.map((shape) => (
          <Link
            key={shape.value}
            href={`/cars?bodyType=${shape.value}`}
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-1 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[#f5f7ff]"
          >
            <img
              src={shape.img}
              alt={shape.label}
              loading="lazy"
              className="h-9 w-9 object-contain"
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 transition-colors group-hover:text-[var(--accent)]">
              {shape.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}