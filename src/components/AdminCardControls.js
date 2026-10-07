"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, XCircle, ToggleLeft, ToggleRight, PencilLine, Loader2, Check } from "lucide-react";
import { useAdminMode } from "@/hooks/use-admin-mode";
import { setCarFlag } from "@/hooks/use-car-flag";

// Admin-only overlay on public car cards (admin view even on normal pages).
// Zero extra network calls — the shared admin-mode flag comes from SiteChrome.
export default function AdminCardControls({ car, inline = false }) {
  const isAdmin = useAdminMode();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isAdmin) return null;

  function toggleMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const el = btnRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const W = 176;
      const innerW = window.innerWidth;
      let left = Math.min(r.right + 4, innerW - W - 8);
      left = Math.max(8, Math.min(left, innerW - W - 8));
      const top = Math.min(r.bottom + 4, Math.max(8, window.innerHeight - 220));
      setMenuPos({ left, top });
    }
    setOpen(true);
  }

  async function run(action, payload = {}) {
    // Apply instantly (optimistic) so the card reacts before the network call.
    if (action === "setSold") setCarFlag(car.id, "sold", true);
    if (action === "reopen") setCarFlag(car.id, "sold", false);
    if (action === "setHidden") setCarFlag(car.id, "hidden", true);
    if (action === "setLive") setCarFlag(car.id, "hidden", false);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/cars/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: car.id, action, payload }),
      });
      if (res.ok) {
        setOpen(false);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
        router.refresh();
      } else {
        throw new Error(`Admin action failed (${res.status})`);
      }
    } catch (err) {
      // Roll back the optimistic change so the UI never lies.
      if (action === "setSold") setCarFlag(car.id, "sold", false);
      if (action === "setHidden") setCarFlag(car.id, "hidden", false);
      console.error(err);
      alert(err?.message || "Action failed — reload and try again");
    } finally {
      setBusy(false);
    }
  }

  const sold = !car.available && car.soldAt != null;
  const itemCls = "flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold hover:bg-zinc-800";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleMenu}
        title="Admin · manage listing"
        aria-label="Admin listing actions"
        className={inline
          ? `relative inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-900/85 px-2.5 text-[11px] font-black uppercase tracking-widest text-amber-300 shadow backdrop-blur transition-colors hover:text-amber-200 ${open ? "ring-2 ring-amber-400/60" : ""}`
          : `absolute top-1.5 right-1.5 z-30 flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900/85 shadow backdrop-blur transition-colors ${open ? "text-amber-300 ring-2 ring-amber-400/60" : "text-amber-300/90 hover:text-amber-300"}`}
      >
        <Shield size={inline ? 12 : 14} />
        {inline && <span>Admin</span>}
        {busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
        {done && !busy && <Check className="h-3 w-3 text-emerald-400" aria-hidden />}
      </button>

      {open && menuPos && (
        <div className="fixed z-[300] w-44 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl" style={{ top: menuPos.top, left: menuPos.left }}>
          <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); router.push(`/admin/cars/${car.id}/edit`); }}
          className={`${itemCls} text-zinc-200`}
        >
          <PencilLine size={13} /> Edit listing
        </button>
          {sold ? (
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); run("reopen"); }} disabled={busy} className={`${itemCls} text-emerald-400 disabled:opacity-50`}>
              <ToggleLeft size={13} /> Reopen
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (confirm("Mark this car as sold?")) run("setSold"); }}
              disabled={busy}
              className={`${itemCls} text-red-400 disabled:opacity-50`}
            >
              <XCircle size={13} /> Mark sold
            </button>
          )}
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); run(car.available ? "setHidden" : "setLive"); }} disabled={busy} className={`${itemCls} text-zinc-200 disabled:opacity-50`}>
            {car.available ? <ToggleRight size={13} /> : <ToggleLeft size={13} />} {car.available ? "Hide" : "Make live"}
          </button>
        </div>
      )}
    </>
  );
}