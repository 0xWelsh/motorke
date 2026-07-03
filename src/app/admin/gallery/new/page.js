"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, Video } from "lucide-react";

export default function NewGalleryPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  const inputCls =
    "w-full bg-[#fbfcfe] dark:bg-zinc-900 border border-[#e2e8f0] dark:border-zinc-800 px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-black dark:focus:border-white transition-all rounded-sm";
  const labelCls = "text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400";

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files || []);
    setGalleryPreviews((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    ]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    formData.set("type", "event");

    fetch("/api/admin/gallery", { method: "POST", body: formData })
      .then((res) => {
        if (res.redirected) router.push("/admin/gallery");
        else res.json().then((err) => alert(err.error || "Failed"));
      })
      .catch(() => alert("Something went wrong"))
      .finally(() => setSaving(false));
  }

  return (
    <div className="mk-page-shell animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-3xl">
      <Link
        href="/admin/gallery"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to gallery
      </Link>

      <section className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#38A169] mb-1">Content</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          New event post
        </h1>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        <input type="hidden" name="type" value="event" />

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-5">
          <div className="space-y-2">
            <label className={labelCls}>Title *</label>
            <input type="text" name="title" required className={inputCls} placeholder="e.g. Cars & Chrome Club Meet" />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Slug (URL)</label>
            <input type="text" name="slug" className={inputCls} placeholder="auto-generated from title if left empty" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>Date</label>
              <input type="date" name="date" className={inputCls} defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Location</label>
              <input type="text" name="location" className={inputCls} placeholder="e.g. Nairobi, Kenya" />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Description / Story</label>
            <textarea
              name="description"
              rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Write about the event, what stood out, notable cars spotted..."
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
          <h2 className={labelCls}>Cover image *</h2>
          <div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-zinc-700 p-8 cursor-pointer hover:border-[#38A169] transition-colors rounded-sm">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Click to upload cover image</span>
              <input type="file" name="coverImage" accept="image/jpeg,image/png,image/webp" required onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
          {coverPreview && (
            <div className="relative w-full aspect-video rounded-sm overflow-hidden border border-slate-200 dark:border-zinc-700">
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
          <h2 className={labelCls}>Event photos</h2>
          <div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-zinc-700 p-8 cursor-pointer hover:border-[#38A169] transition-colors rounded-sm">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Click to upload event photos</span>
              <input type="file" name="galleryImages" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryChange} className="hidden" />
            </label>
          </div>
          {galleryPreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {galleryPreviews.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-sm overflow-hidden border border-slate-200 dark:border-zinc-700">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
          <h2 className={labelCls}>Video clips</h2>
          <p className="text-xs text-slate-500">Short clips from the event (MP4 recommended)</p>
          <div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-zinc-700 p-8 cursor-pointer hover:border-[#38A169] transition-colors rounded-sm">
              <Video className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Click to upload videos</span>
              <input type="file" name="galleryVideos" accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska" multiple onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setVideoPreviews((prev) => [
                  ...prev,
                  ...files.map((f) => ({ file: f, name: f.name })),
                ]);
              }} className="hidden" />
            </label>
          </div>
          {videoPreviews.length > 0 && (
            <div className="space-y-1">
              {videoPreviews.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Video size={14} className="text-slate-400" />
                  {v.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pb-12">
          <Link
            href="/admin/gallery"
            className="inline-flex items-center px-6 py-3 text-xs font-bold uppercase tracking-widest border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:opacity-80 transition-opacity"
            style={{ borderRadius: "var(--radius)" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-8 py-3 text-xs font-bold uppercase tracking-widest bg-[#38A169] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ borderRadius: "var(--radius)" }}
          >
            {saving ? "Saving..." : "Create post"}
          </button>
        </div>
      </form>
    </div>
  );
}
