import Link from "next/link";
import { notFound } from "next/navigation";
import SeoArticleBody from "@/components/SeoArticleBody";
import ComparisonSeoListings from "@/components/ComparisonSeoListings";
import {
  getPublishedSeoPage,
  comparisonPagePath,
  parseComparisonMeta,
  SEO_CONTENT_TYPES,
} from "@/lib/seo-content";
import {
  fetchComparisonInventory,
  fetchRelatedComparisons,
} from "@/lib/seo-comparison-generator";
import { buildHubMetadata } from "@/lib/seo-metadata";
import {
  buildBreadcrumbListSchema,
  articleJsonLd,
  buildFaqSchema,
} from "@/lib/seo-schema";
import { absoluteUrl } from "@/lib/site-url";
// Programmatic comparison pages are the highest-cardinality SEO surface.
// Force-dynamic meant every crawler hit re-ran all DB queries. Cache for 1h.
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPublishedSeoPage(slug, { type: SEO_CONTENT_TYPES.COMPARISON });
  if (!page) return { title: "Comparison not found" };
  return buildHubMetadata({
    title: page.title,
    description: page.description || page.title,
    pathname: comparisonPagePath(slug),
  });
}

function buildFaqItems(cmp, page) {
  return [
    {
      q: `Which is better in Kenya, the ${cmp.makeA} ${cmp.modelA} or the ${cmp.makeB} ${cmp.modelB}?`,
      a: `The right choice depends on your budget, daily route, and priorities. Review live ${cmp.makeA} ${cmp.modelA} and ${cmp.makeB} ${cmp.modelB} listings on BIDGARI and use the side-by-side compare tool to weigh specs, running costs, and total cost of ownership.`,
    },
    {
      q: `Is the ${cmp.makeA} ${cmp.modelA} cheaper than the ${cmp.makeB} ${cmp.modelB} in Kenya?`,
      a: `Prices vary by year, mileage, trim, and whether the car is locally available or at the port. Check current prices on the ${cmp.makeA} ${cmp.modelA} for sale and ${cmp.makeB} ${cmp.modelB} for sale pages for up-to-date figures.`,
    },
    {
      q: `Which has better fuel economy, ${cmp.makeA} ${cmp.modelA} or ${cmp.makeB} ${cmp.modelB}?`,
      a: `Fuel economy depends on engine, transmission, drivetrain, and driving conditions. Hybrid trims typically cost far less per kilometre in city driving. Use BIDGARI's compare tool to see estimated annual energy costs for each listing.`,
    },
    {
      q: `Which holds value better in Kenya, ${cmp.makeA} ${cmp.modelA} or ${cmp.makeB} ${cmp.modelB}?`,
      a: `Resale value is driven by brand demand, spare-part availability, and service network in Kenya. Generally the brand with the larger local install base holds value better. Compare live asking prices and demand signals on BIDGARI.`,
    },
  ];
}

export default async function CompareSeoPage({ params }) {
  const { slug } = await params;
  const page = await getPublishedSeoPage(slug, { type: SEO_CONTENT_TYPES.COMPARISON });
  if (!page) notFound();

  const cmp = parseComparisonMeta(page.meta);
  if (!cmp) notFound();

  const [carsA, carsB, related] = await Promise.all([
    fetchComparisonInventory(cmp.makeA, cmp.modelA),
    fetchComparisonInventory(cmp.makeB, cmp.modelB),
    fetchRelatedComparisons(cmp.makeA, cmp.modelA, cmp.makeB, cmp.modelB, 4),
  ]);

  const compareHref =
    carsA[0] && carsB[0]
      ? `/compare?a=${carsA[0].id}&b=${carsB[0].id}`
      : "/compare";

  const path = comparisonPagePath(slug);
  const breadcrumbs = buildBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
    { name: page.title, path },
  ]);

  const articleSchema = articleJsonLd({
    headline: page.title,
    description: page.description || page.title,
    url: absoluteUrl(path),
    datePublished: page.publishedAt,
    dateModified: page.updatedAt,
  });

  const faqItems = buildFaqItems(cmp, page);
  const faqSchema = buildFaqSchema(faqItems);

  return (
    <article className="min-h-screen bg-white pt-20 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="home-shell max-w-5xl mx-auto space-y-8">
        <div>
          <Link href="/guides" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800">
            ← Guides
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-3">
            {page.title}
          </h1>
          {page.description ? (
            <p className="text-lg text-slate-600 max-w-3xl">{page.description}</p>
          ) : null}
          <Link
            href={compareHref}
            className="btn btn-neutral mt-6"
            style={{ borderRadius: "var(--radius)" }}
          >
            Open side-by-side compare
          </Link>
        </div>

        <div className="max-w-3xl">
          <SeoArticleBody body={page.body} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ComparisonSeoListings make={cmp.makeA} model={cmp.modelA} cars={carsA} />
          <ComparisonSeoListings make={cmp.makeB} model={cmp.modelB} cars={carsB} />
        </div>

        {faqItems.length ? (
          <section className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-5">
                  <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
                  <p className="text-slate-500 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">
              Related comparisons
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={r.path}
                  className="block border border-slate-200 rounded-lg p-4 hover:border-emerald-600 hover:shadow-sm transition"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <span className="font-medium text-slate-800">{r.title}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
