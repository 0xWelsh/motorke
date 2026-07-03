import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Calendar, MapPin, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const post = await db.galleryPost.findUnique({
    where: { slug: params.slug, published: true },
  });
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} | Gallery | Welsh Motorhub`,
    description: post.description?.slice(0, 160) || "",
  };
}

export default async function GalleryPostPage({ params }) {
  const post = await db.galleryPost.findUnique({
    where: { slug: params.slug, published: true },
  });

  if (!post) notFound();

  const items = post.images ? (typeof post.images === "string" ? JSON.parse(post.images) : post.images) : [];
  const photos = items.filter((i) => i.type !== "video");
  const videos = items.filter((i) => i.type === "video");

  return (
    <div className="home-shell min-h-screen py-8 sm:py-12">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to gallery
      </Link>

      <article>
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden mb-8 bg-slate-100 dark:bg-zinc-900">
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No cover image</span>
            </div>
          )}
        </div>

        <header className="max-w-3xl mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString("en-KE", { dateStyle: "long" })}
            </span>
            {post.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {post.location}
              </span>
            )}
          </div>
        </header>

        {post.description && (
          <div className="max-w-3xl mb-10">
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {post.description}
            </p>
          </div>
        )}

        {videos.length > 0 && (
          <section className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#38A169] mb-4">Videos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((v, i) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-200/90 dark:border-zinc-800"
                >
                  <video
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  >
                    <source src={v.url} type="video/mp4" />
                  </video>
                </div>
              ))}
            </div>
          </section>
        )}

        {photos.length > 0 && (
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#38A169] mb-4">Photos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {photos.map((img, i) => (
                <div
                  key={i}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800"
                >
                  <img
                    src={img.url}
                    alt={img.caption || `${post.title} photo ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                      <p className="text-xs text-white font-medium leading-snug">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
