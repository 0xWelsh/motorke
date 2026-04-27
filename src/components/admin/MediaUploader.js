"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, Trash2, Crown, Info, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MediaUploader({ initialImages = [], onFilesSelected, maxFiles = 15 }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState(initialImages.map(img => ({ ...img, id: img.id || Math.random().toString(36).substr(2, 9), preview: img.url || img.preview })));
  const [draggedId, setDraggedId] = useState(null);
  
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const syncFiles = useCallback((nextFiles) => {
    setFiles(nextFiles);
    if (onFilesSelected) onFilesSelected(nextFiles);
  }, [onFilesSelected]);

  useEffect(() => {
    const hasExternalChanges = initialImages.length !== files.filter(f => f.url).length;
    if (hasExternalChanges) {
       setFiles(initialImages.map(img => ({ ...img, id: img.id || Math.random().toString(36).substr(2, 9), preview: img.url || img.preview })));
    }
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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    const incoming = fileArray.map(f => Object.assign(f, { 
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(f), 
      isPrimary: false 
    }));

    const combined = [...files, ...incoming].slice(0, maxFiles);
    if (combined.length > 0 && !combined.find(c => c.isPrimary)) {
      combined[0].isPrimary = true;
    }
    syncFiles([...combined]);
  };

  const removeFile = (id) => {
    const file = files.find(f => f.id === id);
    if (file?.preview && !file.url) URL.revokeObjectURL(file.preview);
    const next = files.filter(f => f.id !== id);
    if (file?.isPrimary && next.length > 0) next[0].isPrimary = true;
    syncFiles([...next]);
  };

  const setPrimary = (id) => {
    const next = files.map((f) => ({ ...f, isPrimary: f.id === id }));
    syncFiles(next);
  };

  const moveFile = (id, direction) => {
    const from = files.findIndex((f) => f.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= files.length) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    syncFiles(next);
  };

  // --- Grid Reorder Logic ---
  const handleItemDragStart = (id) => (e) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (targetId) => (e) => {
    e.preventDefault();
    if (draggedId === targetId) return;

    const draggedIdx = files.findIndex(f => f.id === draggedId);
    const targetIdx = files.findIndex(f => f.id === targetId);
    
    if (draggedIdx === -1 || targetIdx === -1) return;

    const next = [...files];
    const [moved] = next.splice(draggedIdx, 1);
    next.splice(targetIdx, 0, moved);
    setFiles(next); // Immediate local update for "layout" animation
  };

  const handleItemDragEnd = () => {
    setDraggedId(null);
    syncFiles(files); // Final sync on drop
  };

  return (
    <div className="w-full space-y-4">
      <div 
        className={`relative w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-500 overflow-hidden group cursor-pointer ${
          dragActive ? "border-[#ff5a2f] bg-[#ff5a2f]/5 scale-[1.01]" : "border-slate-200 dark:border-slate-800 bg-[#fbfcfe] dark:bg-[#0a0a0a] hover:border-slate-300 dark:hover:border-slate-700"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#ff5a2f]/20 via-transparent to-transparent rounded-full animate-spin-slow" />
        </div>

        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111111] shadow-lg flex items-center justify-center mb-3 text-[#ff5a2f] border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform duration-500">
                <UploadCloud size={24} />
            </div>
            <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">Drop listing photos</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em] mt-2 block">Tap or drag to add</p>
        </div>

        {dragActive && (
          <div className="absolute inset-0 z-50 bg-[#ff5a2f]/10 backdrop-blur-md flex items-center justify-center">
             <div className="bg-white dark:bg-[#111111] px-10 py-5 rounded-full shadow-2xl border border-[#ff5a2f]">
                <p className="text-sm font-black text-[#ff5a2f] uppercase tracking-widest flex items-center gap-3">
                   <CheckCircle2 size={24} /> Drop to Attach
                </p>
             </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="bg-[#fbfcfe] dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#ff5a2f]" />
                 <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Asset Grid</h3>
              </div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-[#111111] rounded-full">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{files.length} / {maxFiles} Assets</p>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div 
                    layout
                    key={file.id} 
                    draggable
                    onDragStart={handleItemDragStart(file.id)}
                    onDragOver={handleItemDragOver(file.id)}
                    onDragEnd={handleItemDragEnd}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#111111] border transition-all duration-300 cursor-grab active:cursor-grabbing ${
                       draggedId === file.id ? "opacity-30 scale-95 border-emerald-500" : "opacity-100 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <img src={file.preview} alt="Listing Photo" className="w-full h-full object-cover pointer-events-none" />
                    
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end p-4 backdrop-blur-sm pointer-events-auto">
                        <div className="w-full space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            {file.isPrimary ? (
                               <div className="w-full py-2 rounded-xl bg-[#ff5a2f] text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                  <Crown size={12} /> Primary Hub
                               </div>
                            ) : (
                              <button 
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrimary(file.id); }}
                                  className="w-full bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl hover:bg-emerald-50 transition-colors"
                              >
                                  Set Main
                              </button>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveFile(file.id, -1); }}
                                className="bg-white/90 text-slate-900 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-1"
                              >
                                <ArrowLeft size={11} /> Left
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveFile(file.id, 1); }}
                                className="bg-white/90 text-slate-900 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-1"
                              >
                                Right <ArrowRight size={11} />
                              </button>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(file.id); }}
                              className="w-full bg-rose-500/80 text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 size={12} /> Purge
                            </button>
                        </div>
                    </div>

                    {file.isPrimary && (
                      <div className="absolute top-4 left-4 p-2 bg-[#ff5a2f] text-white rounded-xl shadow-xl border border-white/20">
                        <Crown size={14} />
                      </div>
                    )}

                    <div className="absolute bottom-4 right-4 text-[8px] font-black text-white/50 uppercase tracking-widest">
                      #{files.indexOf(file) + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>

           <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-3">
              <Info size={14} className="text-[#ff5a2f]" />
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Drag or use Left/Right. Primary image is your cover.</p>
           </div>
        </div>
      )}
    </div>
  );
}
