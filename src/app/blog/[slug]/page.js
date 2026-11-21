import Link from "next/link";
import { notFound } from "next/navigation";
import SeoArticleBody from "@/components/SeoArticleBody";
import {
  getPublishedSeoPage,
  blogPagePath,
  SEO_CONTENT_TYPES,
} from "@/lib/seo-content";
import { buildListingMetadata } from "@/lib/seo-metadata";
import { articleJsonLd } from "@/lib/seo-schema";
import { absoluteUrl } from "@/lib/site-url";

// Content pages are read-heavy and rarely change. ISR turns crawler hits into
// CDN cache hits instead of a full SSR render each time.
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPublishedSeoPage(slug, { type: SEO_CONTENT_TYPES.BLOG });
  if (!page) return { title: "Article not found" };
  return buildListingMetadata({
    title: page.title,
    description: page.description || page.title,
    pathname: blogPagePath(slug),
  });
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const page = await getPublishedSeoPage(slug, { type: SEO_CONTENT_TYPES.BLOG });
  if (!page) notFound();

  const pathname = blogPagePath(slug);
  const jsonLd = articleJsonLd({
    headline: page.title,
    description: page.description,
    datePublished: page.publishedAt?.toISOString(),
    dateModified: page.updatedAt?.toISOString(),
    url: absoluteUrl(pathname),
  });

  return (
    <article className="min-h-screen bg-surface pt-20 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="home-shell max-w-3xl mx-auto">
        <Link href="/blog" className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-text">
          ← Blog
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-text mt-4 mb-3">
          {page.title}
        </h1>
        {page.description ? (
          <p className="text-lg text-muted mb-8">{page.description}</p>
        ) : null}
        <SeoArticleBody body={page.body} />
        <p className="mt-12 text-sm border-t border-border pt-6 text-muted">
          Ready to shop?{" "}
          <Link href="/cars" className="text-[var(--accent)] font-semibold">
            Browse verified listings
          </Link>
        </p>
      </div>
    </article>
  );
}
