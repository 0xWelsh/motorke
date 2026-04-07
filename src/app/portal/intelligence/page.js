// src/app/portal/intelligence/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  TrendingUp, 
  ExternalLink, 
  Newspaper, 
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Market Updates — Motorke Dealer Portal" };

/**
 * Premium dashboard for car dealers to track world automotive news
 * and market intelligence snapshots.
 */
export default async function IntelligencePage() {
  await requireDealer();

  // Fetch the latest car articles cached in our database
  const articles = await db.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 39, // Multiples of 3 for the grid
  });

  return (
    <div className="animate-in fade-in duration-1000 max-w-7xl pb-20">
      {/* Header section with high-contrast typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--brand)] mb-3 block">Market Updates</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">Market Updates</h1>
          <p className="text-slate-500 font-bold mt-4 text-base max-w-2xl">
            Follow the latest automotive news, price shifts, and product launches from trusted sources.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                Live Feed
              </span>
           </div>
        </div>
      </div>

      {/* Articles Grid Implementation */}
      {articles.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[4rem] py-48 text-center px-10 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Newspaper className="text-slate-300" size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Loading Latest Updates...</h3>
            <p className="text-slate-500 text-sm font-bold max-w-sm mx-auto leading-relaxed">
              We are currently loading automotive news from trusted global sources.
            </p>
            <div className="mt-10 inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
               <Clock size={14} /> Expected refresh: &lt; 2 minutes
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {articles.map((article) => (
            <div 
              key={article.id} 
              className="group bg-white border border-slate-100 rounded-[3rem] overflow-hidden hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-700 flex flex-col shadow-sm"
            >
              {/* Premium Image Container */}
              <div className="aspect-[16/11] overflow-hidden relative bg-slate-100 border-b border-slate-50">
                <img 
                  src={article.urlToImage} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" 
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200";
                  }}
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                   <Link 
                     href={article.url} 
                     target="_blank"
                     className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-10 py-4 rounded-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl"
                   >
                     Read Article <ArrowRight size={14} />
                   </Link>
                </div>

                {/* Source Badge */}
                <div className="absolute top-6 left-6">
                   <div className="px-4 py-2 bg-white/95 backdrop-blur-xl rounded-xl text-[9px] font-black uppercase tracking-[0.15em] shadow-xl shadow-black/5 text-slate-900 flex items-center gap-2 border border-white/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {article.sourceName}
                   </div>
                </div>
              </div>

              {/* Sophisticated Content Block */}
              <div className="p-10 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                   <TrendingUp size={14} className="text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                     Auto News
                   </span>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 leading-[1.25] mb-6 mb-6 group-hover:text-[var(--brand)] transition-colors line-clamp-3 tracking-tight">
                  {article.title}
                </h3>
                
                <p className="text-slate-500 text-sm font-bold leading-relaxed line-clamp-3 mb-10 opacity-70">
                  {article.description || "Latest automotive trends and market changes. Open the source article for details."}
                </p>
                
                {/* Footer Meta */}
                <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Published</span>
                      <span className="text-[11px] font-black text-slate-700">
                        {new Date(article.publishedAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                   </div>
                   <Link href={article.url} target="_blank" className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all border border-slate-100">
                      <ExternalLink size={18} />
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
