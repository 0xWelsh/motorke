"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreHorizontal,
  ExternalLink,
  Edit3,
  ToggleLeft,
  ToggleRight,
  XCircle,
  RotateCcw,
  Star,
  TrendingUp,
  PencilLine,
  Share2,
  Copy,
  List,
  MessageSquare,
  X,
  Check,
} from "lucide-react";

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-[var(--bg)]/60 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors";

export default function AdminCarRowActions({ car }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null); // { right, top }
  const [modal, setModal] = useState(null); // null | "boost" | "price" | "share"
  const [busy, setBusy] = useState(false);
  const [boost, setBoost] = useState(car.boostScore ?? 0);
  const [price, setPrice] = useState(car.price ?? "");
  const [copied, setCopied] = useState(false);
  const menuBtnRef = useRef(null);

  const sold = !car.available && car.soldAt != null;
  const listUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/cars/${car.publicSlug || car.id}`;
  const caption = `${car.year} ${car.make} ${car.model} — KES ${Number(car.price || 0).toLocaleString("en-KE")} · Verified & handled by BIDGARI`;

  const run = useCallback(
    async (action, payload = {}) => {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/cars/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carId: car.id, action, payload }),
        });
        if (res.ok) {
          setModal(null);
          setMenuOpen(false);
          router.refresh();
        } else {
          alert("Action failed");
        }
      } finally {
        setBusy(false);
      }
    },
    [car.id, router],
  );

  async function postForm(url, body) {
    setBusy(true);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      setMenuOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const el = menuBtnRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      // Clamp so the 240px menu always stays fully on-screen on any viewport.
      const W = 240;
      const innerW = window.innerWidth;
      let left = Math.min(r.right, innerW - W - 8);
      if (left < 8) left = Math.max(8, r.right - W);
      left = Math.max(8, Math.min(left, innerW - W - 8));
      const top = Math.min(r.bottom + 4, Math.max(8, window.innerHeight - 320));
      setMenuPos({ top, left });
    }
    setMenuOpen(true);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuBtnRef.current && menuBtnRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  async function shareInstagram() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: caption, text: caption, url: listUrl });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${caption}\n\n${listUrl}`);
    } catch {
      /* no-op */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const menuItem = (onClick, icon, label) => (
    <button
      key={label}
      type="button"
      onClick={() => { setMenuOpen(false); onClick(); }}
      disabled={busy}
      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      {/* Always-visible quick actions */}
      <Link href={listUrl} target="_blank" className={iconBtn} title="View on site">
        <ExternalLink size={14} />
      </Link>
      <Link href={`/admin/cars/${car.id}/edit`} className={iconBtn} title="Edit">
        <Edit3 size={14} />
      </Link>
      {car.available ? (
        <button type="button" onClick={() => run("setHidden")} disabled={busy} className={`${iconBtn}`} title="Hide listing">
          <ToggleRight size={14} className="text-emerald-600" />
        </button>
      ) : (
        <button type="button" onClick={() => run("setLive")} disabled={busy} className={iconBtn} title="Make live">
          <ToggleLeft size={14} />
        </button>
      )}
      {sold ? (
        <button type="button" onClick={() => run("reopen")} disabled={busy} className={iconBtn} title="Reopen listing">
          <RotateCcw size={14} className="text-emerald-600" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { if (confirm("Mark this car as sold?")) run("setSold"); }}
          disabled={busy}
          className={iconBtn}
          title="Mark as sold"
        >
          <XCircle size={14} />
        </button>
      )}

      {/* Overflow menu */}
      <button ref={menuBtnRef} type="button" onClick={toggleMenu} aria-expanded={menuOpen} className={`${iconBtn} ${menuOpen ? "text-slate-900 border-slate-300" : ""}`} title="More actions">
        <MoreHorizontal size={15} />
      </button>

      {menuOpen && menuPos && (
        <div className="fixed z-[200] w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl" style={{ top: menuPos.top, left: menuPos.left }}>
          {menuItem(() => run("setFeatured", { featured: !car.featured }), <Star size={14} className={car.featured ? "text-amber-600" : "text-slate-400"} />, car.featured ? "Unfeature" : "Feature")}
          {menuItem(() => setModal("boost"), <TrendingUp size={14} className="text-slate-400" />, "Boost score…")}
          {menuItem(() => setModal("price"), <PencilLine size={14} className="text-slate-400" />, "Change price…")}
          {menuItem(() => setModal("share"), <Share2 size={14} className="text-slate-400" />, "Share listing…")}
          {menuItem(() => postForm(`/api/admin/cars/${car.id}/duplicate`, ""), <Copy size={14} className="text-slate-400" />, "Duplicate listing")}
          {menuItem(() => postForm("/api/whatsapp-channel/post", `carId=${encodeURIComponent(car.id)}`), <MessageSquare size={14} className="text-emerald-500" />, "Post to WhatsApp channel")}
          {menuItem(
            () => { window.open(`/admin/leads?search=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}`, "_blank"); },
            <List size={14} className="text-slate-400" />,
            "View leads",
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {modal === "boost" ? "Boost score" : modal === "price" ? "Edit price (KES)" : "Share listing"}
              </p>
              <button type="button" onClick={() => setModal(null)} className="rounded-md p-1 text-slate-400 hover:text-slate-900">
                <X size={16} />
              </button>
            </div>

            {modal === "boost" && (
              <div className="space-y-3">
                <input
                  type="number" min={0} max={100} value={boost}
                  onChange={(e) => setBoost(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-200 bg-[var(--bg)]/60 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500/50"
                />
                <button type="button" onClick={() => run("setBoost", { boost })} disabled={busy} className="w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                  {busy ? "Saving…" : "Save boost"}
                </button>
              </div>
            )}

            {modal === "price" && (
              <div className="space-y-3">
                <input
                  type="number" min={0} value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 2600000"
                  className="w-full rounded-md border border-slate-200 bg-[var(--bg)]/60 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500/50"
                />
                <button type="button" onClick={() => run("setPrice", { price })} disabled={busy} className="w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                  {busy ? "Saving…" : "Save price"}
                </button>
              </div>
            )}

            {modal === "share" && (
              <div className="space-y-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(`${caption}\n\n${listUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">
                  Share on WhatsApp
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-md bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600">
                  Share on Facebook
                </a>
                <button type="button" onClick={shareInstagram} className="flex items-center justify-center gap-1.5 rounded-md bg-pink-600 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-pink-500">
                  <Copy size={14} /> {copied ? "Link copied — paste in Instagram" : "Instagram (copy / share)"}
                </button>
                <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(listUrl); } catch {} setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:text-slate-900">
                  <Check size={14} /> {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}