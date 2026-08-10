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
import { fetchComparisonInventory } from "@/lib/seo-comparison-generator";
import { buildHubMetadata } from "@/lib/seo-metadata";
import { buildBreadcrumbListSchema } from "@/lib/seo-schema";
export const dynamic = "force-dynamic";

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

export default async function CompareSeoPage({ params }) {
  const { slug } = await params;
  const page = await getPublishedSeoPage(slug, { type: SEO_CONTENT_TYPES.COMPARISON });
  if (!page) notFound();

  const cmp = parseComparisonMeta(page.meta);
  if (!cmp) notFound();

  const [carsA, carsB] = await Promise.all([
    fetchComparisonInventory(cmp.makeA, cmp.modelA),
    fetchComparisonInventory(cmp.makeB, cmp.modelB),
  ]);

  const compareHref =
    carsA[0] && carsB[0]
      ? `/compare?a=${carsA[0].id}&b=${carsB[0].id}`
      : "/compare";

  const breadcrumbs = buildBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
    { name: page.title, path: comparisonPagePath(slug) },
  ]);

  return (
    <article className="min-h-screen bg-white pt-20 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
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
      </div>
    </article>
  );
}
