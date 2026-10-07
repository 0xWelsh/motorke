export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { getSiteOrigin } from "@/lib/site-url";
import CopyUrlButton from "@/components/admin/CopyUrlButton";

export const metadata = { title: "SEO Indexing | BIDGARI Admin" };

// Monthly ritual helper: list indexable URLs from the live sitemap, open each
// in Google Search Console for "Request indexing", and submit Bing's sitemap.
export default async function AdminSeoIndexingPage() {
  await requireAdmin();
  const origin = getSiteOrigin();

  let urls = [];
  try {
    const res = await fetch(`${origin}/sitemap.xml`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const xml = await res.text();
      urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    }
  } catch {
    urls = [];
  }

  const gscProperty = "sc-domain:bidgari.com";
  const gscInspect = (url) =>
    `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(gscProperty)}&id=${encodeURIComponent(url)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">SEO · Indexing</h1>
          <p className="mt-1 text-[12px] text-zinc-500">
            {urls.length} URLs on the sitemap. Monthly ritual: open new pages in Google Search Console → Request indexing, and keep Bing&rsquo;s sitemap submitted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://www.bing.com/webmasters"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-700 px-3.5 py-2 text-[11px] font-bold text-white hover:bg-blue-600 transition-colors"
          >
            Bing Webmaster Tools
          </a>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
          >
            Google Search Console
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/40">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">URL</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {urls.slice(0, 200).map((url) => (
              <tr key={url} className="hover:bg-zinc-800/30">
                <td className="max-w-[400px] truncate px-4 py-2.5 text-[12px] text-zinc-300">{url}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <CopyUrlButton url={url} />
                    <a
                      href={gscInspect(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-800 hover:text-white transition-colors"
                    >
                      GSC inspect
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {urls.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-500">Sitemap not reachable — check bidgari.com/sitemap.xml.</p>
        )}
      </div>
    </div>
  );
}