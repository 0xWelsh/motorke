"use client";
// src/components/Modal.js

import { useState, useCallback, createContext, useContext, useRef } from "react";
import { Info, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";

const ModalContext = createContext(null);

const VARIANTS = {
  info:    { bg: "#1C1C1E", Icon: Info,          confirmBg: "#F59E0B", confirmColor: "#1C1C1E" },
  success: { bg: "#10B981", Icon: CheckCircle,   confirmBg: "#10B981", confirmColor: "white"   },
  warning: { bg: "#F59E0B", Icon: AlertTriangle, confirmBg: "#F59E0B", confirmColor: "#1C1C1E" },
  danger:  { bg: "#EF4444", Icon: Trash2,        confirmBg: "#EF4444", confirmColor: "white"   },
};

function ModalDialog({ modal, onClose }) {
  const v = VARIANTS[modal.variant] || VARIANTS.info;
  const isConfirm = modal.type === "confirm";

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(3px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", animation:"mkFadeIn 0.15s ease" }}
      onClick={() => onClose(false)}
    >
      <style>{`
        @keyframes mkFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes mkSlideUp { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }
      `}</style>
      <div
        style={{ background:"white", borderRadius:16, overflow:"hidden", width:"100%", maxWidth:420, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", animation:"mkSlideUp 0.2s ease" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Colored header */}
        <div style={{ background:v.bg, padding:"22px 24px 18px", display:"flex", alignItems:"center", gap:12 }}>
          <v.Icon size={22} color="white" />
          <h2 style={{ fontWeight:700, fontSize:"1.05rem", color:"white", lineHeight:1.2 }}>{modal.title}</h2>
        </div>

        {/* Body */}
        <div style={{ padding:"20px 24px 24px" }}>
          <p style={{ fontSize:14, color:"#374151", lineHeight:1.6, marginBottom:24 }}>{modal.message}</p>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            {isConfirm && (
              <button onClick={() => onClose(false)} style={{ padding:"9px 20px", borderRadius:9, border:"1.5px solid #E4E4E7", background:"white", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                {modal.cancelLabel || "Cancel"}
              </button>
            )}
            <button onClick={() => onClose(true)} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:v.confirmBg, color:v.confirmColor, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", minWidth:90 }}>
              {isConfirm ? (modal.confirmLabel || "Confirm") : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);
  const idRef = useRef(0);

  const open = useCallback((config) => new Promise((resolve) => {
    const id = ++idRef.current;
    setModals(prev => [...prev, { id, ...config, resolve }]);
  }), []);

  const close = useCallback((id) => {
    setModals(prev => prev.filter(m => m.id !== id));
  }, []);

  const ctx = {
    alert:   (msg, opts = {}) => open({ type:"alert",   title: opts.title || "Notice",  message:msg, variant: opts.type || "info"    }),
    success: (msg, opts = {}) => open({ type:"alert",   title: opts.title || "Success", message:msg, variant:"success"               }),
    confirm: (msg, opts = {}) => open({ type:"confirm", title: opts.title || "Confirm", message:msg, variant: opts.type || "warning", confirmLabel: opts.confirmLabel, cancelLabel: opts.cancelLabel }),
    danger:  (msg, opts = {}) => open({ type:"confirm", title: opts.title || "Delete",  message:msg, variant:"danger",  confirmLabel: opts.confirmLabel || "Yes, delete", cancelLabel: opts.cancelLabel || "Cancel" }),
  };

  return (
    <ModalContext.Provider value={ctx}>
      {children}
      {modals.map(modal => (
        <ModalDialog key={modal.id} modal={modal} onClose={(val) => { modal.resolve(val); close(modal.id); }} />
      ))}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
}