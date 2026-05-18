"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, Crown, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_SQ = 12 * 12;

function isIncluded(f) {
  return f.included !== false;
}

/** First included item in list order is cover / primary. */
function normalizeListingFlags(list) {
  const firstIncludedId = list.find((f) => isIncluded(f))?.id;
  // Never `{ ...f }` — spread strips File/Blob body so uploads become "No file provided".
  return list.map((f) =>
    Object.assign(f, {
      isPrimary: isIncluded(f) && f.id === firstIncludedId,
    })
  );
}

function reorderToIndex(files, draggedId, toIndex) {
  const from = files.findIndex((f) => f.id === draggedId);
  if (from < 0 || toIndex < 0 || toIndex >= files.length || from === toIndex) return files;
  const next = [...files];
  const [moved] = next.splice(from, 1);
  next.splice(toIndex, 0, moved);
  return normalizeListingFlags(next);
}

export default function MediaUploader({ initialImages = [], onFilesSelected, maxFiles = 15 }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState(() =>
    normalizeListingFlags(
      initialImages.map((img) => ({
        ...img,
        included: img.included !== false,
        id: img.id || Math.random().toString(36).substr(2, 9),
        preview: img.url || img.preview,
      }))
    )
  );
  const [liftedId, setLiftedId] = useState(null);

  const filesRef = useRef(files);
  const tileRefs = useRef(new Map());
  const inputRef = useRef(null);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    if (!liftedId) return undefined;
    const prev = document.body.style.touchAction;
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.touchAction = prev;
    };
  }, [liftedId]);

  const finalizeOrder = useCallback(
    (nextList) => {
      const normalized = normalizeListingFlags(nextList);
      setFiles(normalized);
      if (onFilesSelected) onFilesSelected(normalized);
    },
    [onFilesSelected]
  );

  const syncFiles = useCallback(
    (nextFiles) => {
      finalizeOrder(nextFiles);
    },
    [finalizeOrder]
  );

  /* Match parent-provided URLs to local previews; omit `files` from deps (avoid reset loops; same as prior implementation). */
  useEffect(() => {
    const hasExternalChanges = initialImages.length !== files.filter((f) => f.url).length;
    if (hasExternalChanges) {
      setFiles(
        normalizeListingFlags(
          initialImages.map((img) => ({
            ...img,
            included: true,
            id: img.id || Math.random().toString(36).substr(2, 9),
            preview: img.url || img.preview,
          }))
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally compares against latest `files` without listing it
  }, [initialImages]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFiles = useCallback(
    (newFiles) => {
      const fileArray = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
      const incoming = fileArray.map((f) =>
        Object.assign(f, {
          id: Math.random().toString(36).substr(2, 9),
          preview: URL.createObjectURL(f),
          isPrimary: false,
          included: true,
        })
      );

      const combined = normalizeListingFlags([...filesRef.current, ...incoming].slice(0, maxFiles));
      syncFiles(combined);
    },
    [maxFiles, syncFiles]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const setFileIncluded = useCallback(
    (id, checked) => {
      const next = normalizeListingFlags(
        filesRef.current.map((f) => {
          if (f.id !== id) return f;
          return Object.assign(f, { included: checked });
        })
      );
      finalizeOrder(next);
    },
    [finalizeOrder]
  );

  const clearAllFiles = () => {
    const ok = window.confirm("Remove all selected listing photos?");
    if (!ok) return;
    files.forEach((file) => {
      if (file?.preview && !file.url) URL.revokeObjectURL(file.preview);
    });
    syncFiles([]);
  };

  const setTileEl = useCallback((id, el) => {
    if (el) tileRefs.current.set(id, el);
    else tileRefs.current.delete(id);
  }, []);

  function getDropIndex(clientX, clientY, order) {
    for (let i = 0; i < order.length; i++) {
      const el = tileRefs.current.get(order[i].id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientY >= r.top && clientX <= r.right && clientY <= r.bottom) return i;
    }
    return -1;
  }

  const attachPointerDragHandlers = useCallback(
    (e, draggedId) => {
      const startX = e.clientX;
      const startY = e.clientY;
      let longPressTimer = null;
      let active = false;
      let dragOrder = [...filesRef.current];

      const detach = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      const onMove = (ev) => {
        if (!active) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (longPressTimer && dx * dx + dy * dy > MOVE_CANCEL_SQ) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          return;
        }
        ev.preventDefault();
        const t = getDropIndex(ev.clientX, ev.clientY, dragOrder);
        if (t < 0) return;
        const cur = dragOrder.findIndex((f) => f.id === draggedId);
        if (cur === t) return;
        dragOrder = reorderToIndex(dragOrder, draggedId, t);
        setFiles(dragOrder);
      };

      const onUp = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        detach();
        if (active) finalizeOrder(dragOrder);
        setLiftedId(null);
        active = false;
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);

      longPressTimer = window.setTimeout(() => {
        longPressTimer = null;
        active = true;
        dragOrder = [...filesRef.current];
        setLiftedId(draggedId);
        try {
          navigator.vibrate?.(12);
        } catch {
          /* ignore */
        }
        try {
          e.currentTarget?.setPointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
      }, LONG_PRESS_MS);
    },
    [finalizeOrder]
  );

  const coverFile = files[0];
  const otherFiles = files.length > 1 ? files.slice(1) : [];

  const renderPhotoTile = (file, layout) => {
    const isHero = layout === "hero";
    const isLifted = liftedId === file.id;
    const included = isIncluded(file);
    return (
      <motion.div
        layout
        key={file.id}
        ref={(el) => setTileEl(file.id, el)}
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === "mouse") return;
          attachPointerDragHandlers(e, file.id);
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: isLifted ? 1.04 : 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`relative select-none rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#111111] border transition-all duration-200 touch-manipulation ${
          isHero ? "aspect-[2/1] max-h-52 md:max-h-60 w-full" : "aspect-square"
        } ${
          isLifted
            ? "z-50 border-emerald-500 shadow-2xl ring-2 ring-emerald-500/40"
            : !included
              ? "border-slate-400 ring-2 ring-slate-400/40 opacity-90"
              : "max-md:border-0 max-md:ring-1 max-md:ring-slate-200/80 md:border-slate-200 dark:max-md:ring-zinc-700 dark:md:border-slate-800 active:scale-[0.99]"
        }`}
        style={{ cursor: isLifted ? "grabbing" : "grab" }}
      >
        <img src={file.preview} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />

        {!included && (
          <div className="absolute inset-0 z-10 bg-slate-950/40 pointer-events-none flex items-center justify-center p-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white drop-shadow-md text-center leading-tight">
              Skipped — tick to upload
            </span>
          </div>
        )}

        <label
          className="absolute top-2 right-2 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border-2 border-white bg-white shadow-md backdrop-blur-sm dark:bg-[#151515]"
          title={included ? "Untick to skip upload" : "Tick to include in listing"}
          onPointerDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => ev.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={included}
            onChange={(ev) => {
              ev.stopPropagation();
              setFileIncluded(file.id, ev.target.checked);
            }}
            className="h-5 w-5 rounded-[3px] border-2 border-slate-400 accent-[#2F855A] focus:ring-2 focus:ring-[#2F855A]/40 focus:ring-offset-1 focus:ring-offset-white dark:border-slate-500 dark:focus:ring-offset-[#151515]"
            aria-label="Include this photo in the listing upload"
          />
        </label>

        {file.isPrimary && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 bg-[#2F855A] text-white rounded-lg shadow-lg border border-white/20 pointer-events-none">
            <Crown size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">Cover</span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 text-[8px] font-black text-white/90 uppercase tracking-widest drop-shadow-md pointer-events-none">
          #{files.indexOf(file) + 1}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`relative flex h-36 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl p-3 transition-all duration-500 group max-md:border max-md:border-dashed max-md:border-slate-200 max-md:bg-slate-50 sm:h-48 sm:rounded-2xl sm:border-2 dark:max-md:border-zinc-700 dark:max-md:bg-zinc-900/40 ${
          dragActive
            ? "border-[#2F855A] bg-[#2F855A]/5 scale-[1.01]"
            : "max-md:border-slate-200 md:border-slate-200 md:border-dashed md:bg-[#fbfcfe] dark:max-md:border-zinc-700 dark:md:border-slate-800 dark:md:bg-[#0a0a0a] md:hover:border-slate-300 dark:md:hover:border-slate-700"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#2F855A]/20 via-transparent to-transparent rounded-full animate-spin-slow" />
        </div>

        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        <div className="relative z-10 flex flex-col items-center pointer-events-none">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2F855A] shadow-lg transition-transform duration-500 group-hover:scale-110 max-md:border-0 dark:bg-[#111111] md:border md:border-slate-100 dark:md:border-slate-800">
            <UploadCloud size={24} />
          </div>
          <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">Drop listing photos</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em] mt-2 block">Tap or drag to add</p>
        </div>

        {dragActive && (
          <div className="absolute inset-0 z-50 bg-[#2F855A]/10 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white dark:bg-[#111111] px-10 py-5 rounded-full shadow-2xl border border-[#2F855A]">
              <p className="text-sm font-black text-[#2F855A] uppercase tracking-widest flex items-center gap-3">
                <CheckCircle2 size={24} /> Drop to Attach
              </p>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="max-md:p-0 max-md:shadow-none rounded-2xl bg-[#fbfcfe] p-4 shadow-sm max-md:border-0 max-md:bg-transparent dark:bg-[#0a0a0a] md:border md:border-slate-200 dark:md:border-slate-800">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#2F855A] shrink-0" />
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] truncate">Photos</h3>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-[#111111] rounded-full">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {files.length} / {maxFiles}
                </p>
              </div>
              <button
                type="button"
                onClick={clearAllFiles}
                className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {coverFile && (
            <div className="mb-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                First slot — long-press &amp; drag to reorder (cover badge = first ticked photo)
              </p>
              <AnimatePresence mode="popLayout">{renderPhotoTile(coverFile, "hero")}</AnimatePresence>
            </div>
          )}

          {otherFiles.length > 0 && (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">More photos</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <AnimatePresence>{otherFiles.map((file) => renderPhotoTile(file, "grid"))}</AnimatePresence>
              </div>
            </>
          )}

          {files.length === 1 && (
            <p className="text-[11px] font-semibold text-slate-500 mt-3">Add more shots so buyers see the full vehicle.</p>
          )}

          <div className="mt-4 flex items-center gap-3 max-md:border-t-0 max-md:pt-2 md:border-t md:border-slate-100 md:pt-4 dark:md:border-slate-800/50">
            <Info size={14} className="text-[#2F855A] shrink-0" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-snug">
              New photos are ticked by default (upload). Untick any you do not want on the listing. Long-press, then drag to reorder — first checked photo becomes cover.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
