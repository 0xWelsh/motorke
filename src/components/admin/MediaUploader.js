"use client";
import React, { useState, useCallback, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";

export default function MediaUploader({ initialImages = [], onFilesSelected, maxFiles = 10 }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState(initialImages.map(img => ({ ...img, preview: img.url || img.preview })));

  useEffect(() => {
    // Sync external changes (like upload completion)
    if (initialImages.length !== files.filter(f => f.url).length) {
       setFiles(initialImages.map(img => ({ ...img, preview: img.url || img.preview })));
    }
  }, [initialImages]);
  const inputRef = useRef(null);

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

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    const combined = [...files, ...fileArray].map(f => {
      if (!f.preview) Object.assign(f, { preview: URL.createObjectURL(f), isPrimary: false });
      return f;
    }).slice(0, maxFiles);
    
    // Auto primary if none
    if (combined.length > 0 && !combined.find(c => c.isPrimary)) {
      combined[0].isPrimary = true;
    }
    
    setFiles([...combined]);
    if (onFilesSelected) onFilesSelected([...combined]);
  };

  const removeFile = (idx) => {
    const newArr = [...files];
    if (newArr[idx].preview && !newArr[idx].url) URL.revokeObjectURL(newArr[idx].preview);
    newArr.splice(idx, 1);
    if (files[idx].isPrimary && newArr.length > 0) newArr[0].isPrimary = true;
    
    setFiles([...newArr]);
    if (onFilesSelected) onFilesSelected([...newArr]);
  };

  const setPrimary = (idx) => {
    const newArr = files.map((f, i) => ({ ...f, isPrimary: i === idx }));
    setFiles(newArr);
    if (onFilesSelected) onFilesSelected(newArr);
  };

  return (
    <div className="w-full space-y-6">
      <div 
        className={`relative w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 transition-all duration-300 ${
          dragActive ? "border-emerald-500 bg-emerald-50 scale-[1.02]" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleChange} 
        />
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-emerald-600 border border-slate-100">
          <UploadCloud size={32} />
        </div>
        <p className="text-lg font-black text-slate-900 tracking-tight">Drag & Drop Media Assets</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 block">Or click to browse standard files</p>
        
        {dragActive && (
          <div className="absolute inset-0 z-50 bg-emerald-600/5 backdrop-blur-sm rounded-3xl border-2 border-emerald-500 flex items-center justify-center">
             <p className="text-xl font-black text-emerald-600 tracking-tighter shadow-sm bg-white px-8 py-3 rounded-full flex items-center gap-2">
                <CheckCircle2 size={24} /> DROP TO ATTACH
             </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-slate-900" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Asset Queue</h3>
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{files.length} / {maxFiles} Attached</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file, i) => (
               <div key={i} className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                  <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 backdrop-blur-sm">
                    {!file.isPrimary && (
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrimary(i); }}
                        className="w-full bg-white hover:bg-emerald-50 text-slate-900 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-xl active:scale-95"
                      >
                        Main Hub
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(i); }}
                      className="w-full bg-rose-500/90 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-xl"
                    >
                      Purge Asset
                    </button>
                  </div>
                  
                  {file.isPrimary && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-emerald-400 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Asset Primary
                    </div>
                  )}

               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
