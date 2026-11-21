import Link from "next/link";
import { modelHubPath } from "@/lib/seo-model-wiki";
import { resolveDutyPathForCar } from "@/lib/seo-duty";

export default function CarModelWiki({ car, wiki }) {
  if (!wiki?.paragraphs?.length) return null;

  const hubHref = modelHubPath(car.make, car.model);
  const dutyPath = resolveDutyPathForCar(car);

  return (
    <section aria-labelledby="model-wiki-heading">
      <h2 id="model-wiki-heading" className="text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--accent)] mb-4">
        {wiki.source === "curated" ? "Buyer Notes" : wiki.source === "listing" ? "About This Listing" : "Buyer Notes"}
      </h2>

      <div className="space-y-3 text-[14px] sm:text-[15px] text-muted leading-[1.7]">
        {wiki.paragraphs.map((para) => (
          <p key={para.slice(0, 40)}>{para}</p>
        ))}
      </div>

      {wiki.bullets?.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-[14px] sm:text-[15px] text-muted leading-[1.7]">
          {wiki.bullets.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[13px] text-muted">
        <Link href={hubHref} className="font-semibold text-[var(--accent)] hover:underline">
          Browse all {car.make} {car.model} for sale
        </Link>
        {dutyPath && (
          <>
            <span className="mx-2 opacity-40">·</span>
            <Link href={dutyPath} className="font-semibold text-[var(--accent)] hover:underline">
              Import duty calculator
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
