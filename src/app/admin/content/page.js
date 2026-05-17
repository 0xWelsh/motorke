import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";
import { contentPublicPath } from "@/lib/seo-content";
import { ExternalLink, FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content — Welsh Motorhub Admin" };

export default async function AdminContentPage() {
  await requireAdmin();

  let pages = [];
  try {
    pages = await db.seoContentPage.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
    });
  } catch {
    pages = [];
  }

  const published = pages.filter((p) => p.status === "PUBLISHED").length;

  return (
    <div className="mk-page-shell animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-5xl">
      <AdminPageHeader
        eyebrow="SEO Phase 2"
        title="Content engine"
        description="Blog posts, landing guides, and model comparison pages. Run db:seed-seo-content after migrate."
        actions={
          <Link
            href="/guides"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:opacity-80"
            style={{ borderRadius: "var(--radius)" }}
          >
            Public guides <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total pages", value: pages.length },
          { label: "Published", value: published },
          { label: "Blog", value: pages.filter((p) => p.type === "BLOG").length },
          { label: "Comparisons", value: pages.filter((p) => p.type === "COMPARISON").length },
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

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
        CLI: <code className="text-[11px]">npm run db:seed-seo-content</code> · Cron:{" "}
        <code className="text-[11px]">/api/cron/seo-content?secret=CRON_SECRET</code>
      </p>

      {pages.length === 0 ? (
        <p className="text-sm text-slate-500">No content pages yet. Run the seed script after migration.</p>
      ) : (
        <section className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">Pages</h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {pages.map((page) => {
              const href = contentPublicPath(page);
              return (
                <li key={page.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{page.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">
                      {page.type} · {page.status} · {page.slug}
                    </p>
                  </div>
                  {href && page.status === "PUBLISHED" ? (
                    <Link
                      href={href}
                      target="_blank"
                      className="text-[10px] font-bold uppercase tracking-widest text-[#2F855A]"
                    >
                      View
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-slate-500">
        <Link href="/admin/seo" className="text-[#2F855A] font-semibold hover:opacity-80">
          ← Technical SEO
        </Link>
      </p>
    </div>
  );
}
