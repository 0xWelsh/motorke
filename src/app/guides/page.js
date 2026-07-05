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
  title: buildPageTitle("Buyer guides & trending searches"),
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
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-20 pb-24">
      <div className="home-shell max-w-5xl mx-auto space-y-10">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Content</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">Buyer guides</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            Curated pages for SEO and discovery, compare popular models, read buying advice, and jump straight into inventory.
          </p>
        </header>

        <TrendingSearches limit={12} />

        {landings.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Featured guides</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {landings.map((page) => (
                <li key={page.id}>
                  <Link
                    href={guidePagePath(page.slug)}
                    className="block h-full rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-4 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-white">{page.title}</h3>
                    {page.description ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
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
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Model comparisons</h2>
            <ul className="flex flex-wrap gap-2">
              {comparisons.map((page) => (
                <li key={page.id}>
                  <Link
                    href={comparisonPagePath(page.slug)}
                    className="inline-block px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-zinc-700 hover:border-slate-900 dark:hover:border-white transition-colors"
                    style={{ borderRadius: "var(--radius)" }}
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
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">From the blog</h2>
            <ul className="space-y-3">
              {blogPosts.map((post) => (
                <li key={post.id}>
                  <Link href={blogPagePath(post.slug)} className="text-sm font-semibold text-[#2F855A] hover:opacity-80">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/blog" className="inline-block mt-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white">
              All articles →
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
