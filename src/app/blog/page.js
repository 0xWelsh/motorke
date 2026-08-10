import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { listPublishedSeoPages, blogPagePath } from "@/lib/seo-content";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";

export const dynamic = "force-dynamic";

export const metadata = {
  title: buildPageTitle("Car buying guides & blog"),
  description:
    "Practical articles for Kenyan car buyers: imports, duty, financing, and how to shop verified listings on BIDGARI.",
  ...buildCanonicalMetadata("/blog"),
};

export default async function BlogIndexPage() {
  const posts = await listPublishedSeoPages({ type: "BLOG", take: 40 });

  return (
    <div className="min-h-screen bg-white pt-20 pb-24">
      <div className="home-shell max-w-4xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Guides</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Blog</h1>
        <p className="text-slate-600 mb-10 max-w-2xl">
          Editorial tips for buying and importing vehicles in Kenya. Pair these with live inventory search and our duty calculator.
        </p>

        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">Articles are being published. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={blogPagePath(post.slug)}
                className="group flex flex-col bg-white border border-slate-200 rounded-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="flex-1 flex flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#38A169] mb-2.5">
                    <Calendar className="w-3 h-3" aria-hidden />
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
                      : null}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#38A169] transition-colors leading-snug">
                    {post.title}
                  </h2>
                  {post.description ? (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">
                      {post.description}
                    </p>
                  ) : null}
                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#38A169] transition-colors">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-10 text-sm text-slate-500">
          <Link href="/guides" className="text-[#2F855A] font-semibold hover:opacity-80">
            Browse all guides
          </Link>
          {", "}
          <Link href="/cars" className="text-[#2F855A] font-semibold hover:opacity-80">
            Search cars
          </Link>
        </p>
      </div>
    </div>
  );
}
