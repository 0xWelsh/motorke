import Link from "next/link";
import { getDutyPageRelatedLinks } from "@/lib/seo-duty";

export default function DutyRelatedSearches({ vehicle = null }) {
  const links = getDutyPageRelatedLinks(vehicle, { take: 8 });
  if (!links.length) return null;

  return (
    <nav
      className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-muted"
      aria-label="Related searches"
    >
      <span className="text-muted font-black tracking-widest w-full sm:w-auto">
        Related:
      </span>
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-[var(--accent)] hover:underline normal-case tracking-normal"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
