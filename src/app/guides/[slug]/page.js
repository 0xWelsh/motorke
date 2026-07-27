import Link from "next/link";
import { notFound } from "next/navigation";
import SeoArticleBody from "@/components/SeoArticleBody";
import {
  getPublishedSeoPage,
  guidePagePath,
  parseLandingMeta,
  SEO_CONTENT_TYPES,
} from "@/lib/seo-content";
import { buildHubMetadata } from "@/lib/seo-metadata";
import { articleJsonLd } from "@/lib/seo-schema";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPublishedSeoPage(slug, { type: SEO_CONTENT_TYPES.LANDING });
  if (!page) return { title: "Guide not found" };
  return buildHubMetadata({
    title: page.title,
    description: page.description || page.title,
    pathname: guidePagePath(slug),
  });
}

export default async function GuideLandingPage({ params }) {
  const { slug } = await params;
  const page = await getPublishedSeoPage(slug, { type: SEO_CONTENT_TYPES.LANDING });
  if (!page) notFound();

  const landing = parseLandingMeta(page.meta);
  const pathname = guidePagePath(slug);
  const jsonLd = articleJsonLd({
    headline: page.title,
    description: page.description,
    datePublished: page.publishedAt?.toISOString(),
    dateModified: page.updatedAt?.toISOString(),
    url: absoluteUrl(pathname),
  });

  return (
    <article className="min-h-screen bg-[#1c1c1c] pt-20 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="home-shell max-w-3xl mx-auto">
        <Link href="/guides" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white">
          ← Guides
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-3">
          {page.title}
        </h1>
        {page.description ? (
          <p className="text-lg text-zinc-400 mb-8">{page.description}</p>
        ) : null}
        {landing?.hubPath ? (
          <Link
            href={landing.hubPath}
            className="inline-flex mb-8 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[var(--accent)] text-white hover:opacity-90 transition-opacity rounded-xl"
          >
            {landing.ctaLabel}
          </Link>
        ) : null}
        <SeoArticleBody body={page.body} />
      </div>
    </article>
  );
}
