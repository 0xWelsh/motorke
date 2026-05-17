import Link from "next/link";
import { listPublishedSeoPages, blogPagePath } from "@/lib/seo-content";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";

export const dynamic = "force-dynamic";

export const metadata = {
  title: buildPageTitle("Car buying guides & blog"),
  description:
    "Practical articles for Kenyan car buyers — imports, duty, financing, and how to shop verified listings on Welsh Motorhub.",
  ...buildCanonicalMetadata("/blog"),
};

export default async function BlogIndexPage() {
  const posts = await listPublishedSeoPages({ type: "BLOG", take: 40 });

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-20 pb-24">
      <div className="home-shell max-w-4xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Guides</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">Blog</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-10 max-w-2xl">
          Editorial tips for buying and importing vehicles in Kenya. Pair these with live inventory search and our duty calculator.
        </p>

        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">Articles are being published — check back soon.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={blogPagePath(post.slug)}
                  className="block rounded-xl border border-slate-200 dark:border-zinc-800 px-5 py-4 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{post.title}</h2>
                  {post.description ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{post.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-sm text-slate-500">
          <Link href="/guides" className="text-[#2F855A] font-semibold hover:opacity-80">
            Browse all guides
          </Link>
          {" · "}
          <Link href="/cars" className="text-[#2F855A] font-semibold hover:opacity-80">
            Search cars
          </Link>
        </p>
      </div>
    </div>
  );
}
