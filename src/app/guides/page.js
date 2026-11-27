import Link from "next/link";
import TrendingSearches from "@/components/TrendingSearches";
import {
  listPublishedSeoPages,
  guidePagePath,
  comparisonPagePath,
  blogPagePath,
} from "@/lib/seo-content";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: buildPageTitle("Buyer guides & trending searches") },
  description:
    "Landing guides, model comparisons, and what Kenyan shoppers are searching for right now on BIDGARI.",
  ...buildCanonicalMetadata("/guides"),
};

export default async function GuidesIndexPage() {
  const [landings, comparisons, blogPosts] = await Promise.all([
    listPublishedSeoPages({ type: "LANDING", take: 120 }),
    listPublishedSeoPages({ type: "COMPARISON", take: 80 }),
    listPublishedSeoPages({ type: "BLOG", take: 24 }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-20 pb-24">
      <div className="home-shell max-w-5xl mx-auto space-y-10">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">Content</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">Buyer guides</h1>
          <p className="text-muted max-w-2xl">
            Curated pages for SEO and discovery, compare popular models, read buying advice, and jump straight into inventory.
          </p>
        </header>

        <TrendingSearches limit={12} />

        {landings.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-4">Featured guides</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {landings.map((page) => (
                <li key={page.id}>
                  <Link
                    href={guidePagePath(page.slug)}
                    className="block h-full rounded-xl border border-border px-4 py-4 hover:border-border transition-colors"
                  >
                    <h3 className="font-bold text-text">{page.title}</h3>
                    {page.description ? (
                      <p className="text-sm text-muted mt-2 line-clamp-2">
                        {page.description}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {comparisons.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-4">Model comparisons</h2>
            <ul className="flex flex-wrap gap-2">
              {comparisons.map((page) => (
                <li key={page.id}>
                  <Link
                    href={comparisonPagePath(page.slug)}
                    className="inline-block px-3 py-2 text-xs font-semibold border border-border hover:border-strong transition-colors rounded-xl"
                  >
                    {page.title.replace(/: which to buy in Kenya\?$/i, "")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {blogPosts.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-4">From the blog</h2>
            <ul className="space-y-3">
              {blogPosts.map((post) => (
                <li key={post.id}>
                  <Link href={blogPagePath(post.slug)} className="text-sm font-semibold text-[var(--accent)] hover:opacity-80">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/blog" className="inline-block mt-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-text">
              All articles →
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
