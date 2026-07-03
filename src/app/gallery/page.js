import Link from "next/link";
import { db } from "@/lib/db";
import { Calendar, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery | Welsh Motorhub" };

export default async function GalleryPage() {
  const [posts, rawSettings] = await Promise.all([
    db.galleryPost.findMany({
      where: { published: true },
      orderBy: { date: "desc" },
    }),
    db.setting.findMany({
      where: { key: { in: ["magazine_cover_url", "magazine_link"] } },
    }),
  ]);

  const settings = rawSettings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  const magCover = settings.magazine_cover_url;
  const magLink = settings.magazine_link || "https://selar.com/m/CircusCarMagazine";

  return (
    <div className="home-shell min-h-screen py-8 sm:py-12">
      <section className="mb-10 sm:mb-14">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#38A169] mb-2">Gallery</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal editorial-heading text-slate-900 dark:text-white mb-4">
          Car Culture in Kenya
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
          Photos and stories from events, shows, and the scene.
        </p>
      </section>

      {magCover && (
        <section className="mb-12 sm:mb-16 max-w-xs">
          <a href={magLink} target="_blank" rel="noopener noreferrer" className="group block">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
              <img
                src={magCover}
                alt="Circus Car Magazine"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="mt-3 text-sm font-black text-slate-900 dark:text-white group-hover:text-[#38A169] transition-colors">
              Circus Car Magazine
            </p>
          </a>
        </section>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-slate-500">No event posts yet. Check back soon.</p>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#38A169] mb-4">Event Coverage</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/gallery/${post.slug}`}
                className="group block rounded-xl overflow-hidden border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111111] ring-1 ring-black/[0.03] dark:ring-white/[0.04] transition-shadow hover:shadow-lg dark:hover:shadow-xl"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[#38A169]/10 text-[#38A169]">
                    Event
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-2 mb-2 line-clamp-2 group-hover:text-[#38A169] transition-colors">
                    {post.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.date).toLocaleDateString("en-KE", { dateStyle: "long" })}
                    </span>
                    {post.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {post.location}
                      </span>
                    )}
                  </div>
                  {post.description && (
                    <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
