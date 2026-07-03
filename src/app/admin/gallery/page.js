import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery | Welsh Motorhub Admin" };

export default async function AdminGalleryPage() {
  await requireAdmin();

  const posts = await db.galleryPost.findMany({
    orderBy: { date: "desc" },
  });

  const eventCount = posts.filter((p) => p.type === "event").length;
  const magazineCount = posts.filter((p) => p.type === "magazine").length;

  return (
    <div className="mk-page-shell animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-5xl">
      <section className="relative mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#38A169] mb-1">Content</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Gallery
          </h1>
          <div className="flex gap-2">
            <Link
              href="/gallery"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:opacity-80"
              style={{ borderRadius: "var(--radius)" }}
            >
              View gallery <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/gallery/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[#38A169] text-white hover:opacity-90"
              style={{ borderRadius: "var(--radius)" }}
            >
              <Plus className="w-3.5 h-3.5" /> New post
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total posts", value: posts.length },
          { label: "Events", value: eventCount },
          { label: "Magazine", value: magazineCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">No gallery posts yet. Create your first one.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3"
            >
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt=""
                  className="w-16 h-12 object-cover rounded-md shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{post.title}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500">
                    {post.type}
                  </span>
                  {!post.published && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {new Date(post.date).toLocaleDateString("en-KE", { dateStyle: "long" })}
                  {post.location ? ` · ${post.location}` : ""}
                </p>
              </div>
              <Link
                href={`/gallery/${post.slug}`}
                target="_blank"
                className="text-[10px] font-bold uppercase tracking-widest text-[#38A169] hover:underline shrink-0"
              >
                View
              </Link>
              <form action="/api/admin/gallery" method="POST" className="shrink-0">
                <input type="hidden" name="_method" value="DELETE" />
                <input type="hidden" name="id" value={post.id} />
                <button
                  type="submit"
                  className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
