"use client";
// src/app/admin/news/page.js
import { useState, useEffect } from "react";
import { Plus, Newspaper, CheckCircle2, AlertCircle, Trash2, Send } from "lucide-react";

export default function AdminNewsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", tag: "Trends", image: "" });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/news?limit=50");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus({ type: "success", msg: "Post published successfully!" });
        setFormData({ title: "", content: "", tag: "Trends", image: "" });
        setShowForm(false);
        fetchPosts();
      } else {
        const err = await res.json();
        setStatus({ type: "error", msg: err.error || "Failed to publish" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Market Intelligence</h2>
          <p className="text-white/40 font-medium mt-1">Manage news articles and market insights.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-orange-600/20"
        >
          {showForm ? "Cancel" : <><Plus size={14} /> New Article</>}
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold uppercase tracking-widest">{status.msg}</span>
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Newspaper size={20} className="text-orange-500" />
            Compose Article
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Article Title</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. KRA Announces New Import Rules"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Category Tag</label>
                <select 
                  value={formData.tag}
                  onChange={e => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all cursor-pointer"
                >
                  {["Policy", "Trends", "Logistics", "Market Update", "Buying Guide"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Cover Image URL</label>
              <input 
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Content (Markdown supported)</label>
              <textarea 
                required
                rows={6}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write the analyst insight here..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-white text-slate-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50"
              >
                {saving ? "Publishing..." : <><Send size={14} /> Publish Article</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-white/20">Loading news database...</div>
        ) : posts.length === 0 ? (
          <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <Newspaper size={40} className="mx-auto text-white/5 mb-4" />
            <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No articles published yet.</p>
          </div>
        ) : posts.map(post => (
          <div key={post.id} className="bg-surface border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-orange-500/20 transition-all">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-xl bg-orange-600/5 flex items-center justify-center text-2xl overflow-hidden border border-white/5">
                   {post.image ? <img src={post.image} className="w-full h-full object-cover opacity-50" /> : "🗞️"}
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <span className="text-[9px] font-black bg-orange-600/10 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{post.tag}</span>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{new Date(post.createdAt).toLocaleDateString()}</span>
                   </div>
                   <h4 className="font-bold text-white">{post.title}</h4>
                   <p className="text-xs text-white/30 truncate max-w-md">{post.content.substring(0, 80)}...</p>
                </div>
             </div>
             <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-3 text-white/20 hover:text-white transition-colors" title="Edit coming soon">
                   <AlertCircle size={16} />
                </button>
                <button className="p-3 text-white/20 hover:text-rose-500 transition-colors" title="Delete coming soon">
                   <Trash2 size={16} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
