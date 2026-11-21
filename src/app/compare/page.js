import Link from "next/link";
import { db } from "@/lib/db";
import CompareClient from "./CompareClient";
import { findMatchingSpec } from "@/lib/model-specs";
import { listPublishedSeoPages, comparisonPagePath, parseComparisonMeta } from "@/lib/seo-content";
import { buildBreadcrumbListSchema } from "@/lib/seo-schema";

export const metadata = {
  title: "Compare cars side by side (Kenya)",
  description:
    "Compare up to three Kenyan vehicle listings side by side: price, specs, duties, efficiency, and running costs on BIDGARI.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare vehicles | BIDGARI",
    description:
      "Stack two or three Kenyan listings beside each other before you enquire. Built for decisive buyers.",
    type: "website",
    url: "/compare",
  },
};

async function getPopularComparisons() {
  const pages = await listPublishedSeoPages({ type: "COMPARISON", take: 12 });
  const parsed = [];
  for (const p of pages) {
    const cmp = parseComparisonMeta(p.meta);
    if (!cmp) continue;
    parsed.push({
      slug: p.slug,
      title: p.title,
      path: comparisonPagePath(p.slug),
      label: `${cmp.makeA} ${cmp.modelA} vs ${cmp.makeB} ${cmp.modelB}`,
    });
  }
  return parsed;
}

export default async function ComparePage({ searchParams }) {
  const sp = await searchParams;
  const idsInUrl = [sp.a, sp.b, sp.c].filter(Boolean);

  const cars = idsInUrl.length > 0
    ? await db.car.findMany({
        where:   { id: { in: idsInUrl }, available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { name: true, slug: true, location: true, verified: true } },
        },
      })
    : [];

  // Sort by the order they were requested in URL
  const orderedCars = idsInUrl.map((id) => cars.find((c) => c.id === id)).filter(Boolean);

  // Attach reference specs to each car for deeper compare
  const enriched = await Promise.all(
    orderedCars.map(async (car) => {
      const refSpec = await findMatchingSpec({
        make: car.make,
        model: car.model,
        variant: car.variant,
        year: car.year,
      });
      return { ...car, _refSpec: refSpec || null };
    })
  );

  const popularComparisons = await getPopularComparisons();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListSchema([
              { name: "Home", path: "/" },
              { name: "Compare", path: "/compare" },
            ])
          ),
        }}
      />
      <CompareClient initialCars={enriched} />
      {popularComparisons.length ? (
        <div className="home-shell max-w-5xl mx-auto py-12 px-4">
          <h2 className="text-2xl font-bold text-text mb-4">
            Popular car comparisons in Kenya
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularComparisons.map((c) => (
              <Link
                key={c.slug}
                href={c.path}
                className="block border border-border rounded-lg p-4 hover:border-emerald-600 hover:shadow-sm transition"
                style={{ borderRadius: "var(--radius)" }}
              >
                <span className="font-medium text-text">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

