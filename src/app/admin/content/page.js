import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";
import { contentPublicPath } from "@/lib/seo-content";
import { ExternalLink, FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content | BIDGARI Admin" };

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
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-white text-white hover:opacity-80"
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
            className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] px-4 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{s.label}</p>
            <p className="text-2xl font-bold text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-400 mb-6">
        CLI: <code className="text-[11px]">npm run db:seed-seo-content</code> · Cron:{" "}
        <code className="text-[11px]">/api/cron/seo-content?secret=CRON_SECRET</code>
      </p>

      {pages.length === 0 ? (
        <p className="text-sm text-zinc-400">No content pages yet. Run the seed script after migration.</p>
      ) : (
        <section className="rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.03] flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pages</h2>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {pages.map((page) => {
              const href = contentPublicPath(page);
              return (
                <li key={page.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{page.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">
                      {page.type} · {page.status} · {page.slug}
                    </p>
                  </div>
                  {href && page.status === "PUBLISHED" ? (
                    <Link
                      href={href}
                      target="_blank"
                      className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]"
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

      <p className="mt-8 text-xs text-zinc-400">
        <Link href="/admin/seo" className="text-[var(--accent)] font-semibold hover:opacity-80">
          ← Technical SEO
        </Link>
      </p>
    </div>
  );
}
