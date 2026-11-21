import Link from "next/link";

const MAKES = [
  { name: "Toyota", slug: "Toyota", img: "/images/logos/logo_toyota.png" },
  { name: "Mercedes", slug: "Mercedes-Benz", img: "/images/logos/logo_mercedes.png" },
  { name: "Mazda", slug: "Mazda", img: "/images/logos/logo_mazda.png" },
  { name: "Subaru", slug: "Subaru", img: "/images/logos/logo_subaru.png" },
  { name: "Nissan", slug: "Nissan", img: "/images/logos/logo_nissan.png" },
  { name: "Lexus", slug: "Lexus", img: "/images/logos/logo_lexus.png" },
  { name: "Audi", slug: "Audi", img: "/images/logos/logo_audi.png" },
  { name: "Volkswagen", slug: "Volkswagen", img: "/images/logos/logo_volkswagen.png" },
  { name: "BMW", slug: "BMW", img: "/images/logos/logo_bmw.png" },
  { name: "Honda", slug: "Honda", img: "/images/logos/logo_honda.png" },
  { name: "Land Rover", slug: "Land Rover", img: "/images/logos/logo_land-rover.png" },
  { name: "Volvo", slug: "Volvo", img: "/images/logos/logo_volvo.png" },
];

/**
 * Nikkyo-style "Search by Make" logo grid (4 columns, 12 tiles).
 */
export default function HomepageMakeGrid({ heading = "Search by Make" }) {
  return (
    <section aria-labelledby="make-grid-heading" className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3 border-b-2 border-[var(--accent)] pb-1.5">
        <h2
          id="make-grid-heading"
          className="text-sm font-black uppercase tracking-wider text-text sm:text-base"
        >
          {heading}
        </h2>
        <Link
          href="/cars"
          className="inline-flex shrink-0 items-center gap-1 rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          More
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {MAKES.map((make) => (
          <Link
            key={make.slug}
            href={`/cars?make=${encodeURIComponent(make.slug)}`}
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface px-1 py-3 transition-colors hover:border-[var(--accent)] hover:bg-accent-wash"
          >
            <img
              src={make.img}
              alt={make.name}
              loading="lazy"
              className="h-9 w-9 object-contain"
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary transition-colors group-hover:text-[var(--accent)]">
              {make.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}