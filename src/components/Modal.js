"use client";
// src/components/Modal.js

import { useState, useCallback, createContext, useContext, useRef } from "react";
import { Info, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";

const ModalContext = createContext(null);

const VARIANTS = {
  info:    { bg: "#1A1A1A", Icon: Info,          confirmBg: "#ea580c", confirmColor: "white" },
  success: { bg: "#10B981", Icon: CheckCircle,   confirmBg: "#10B981", confirmColor: "white"   },
  warning: { bg: "#F59E0B", Icon: AlertTriangle, confirmBg: "#F59E0B", confirmColor: "white" },
  danger:  { bg: "#EF4444", Icon: Trash2,        confirmBg: "#EF4444", confirmColor: "white"   },
};

function ModalDialog({ modal, onClose }) {
  const v = VARIANTS[modal.variant] || VARIANTS.info;
  const isConfirm = modal.type === "confirm";

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", animation:"mkFadeIn 0.15s ease" }}
      onClick={() => onClose(false)}
    >
      <style>{`
        @keyframes mkFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes mkSlideUp { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }
      `}</style>
      <div
        style={{ background:"#111", border:"1px solid rgba(255,255,255,0.05)", borderRadius:24, overflow:"hidden", width:"100%", maxWidth:420, boxShadow:"0 24px 60px rgba(0,0,0,0.8)", animation:"mkSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Colored header */}
        <div style={{ background:v.bg, padding:"24px 24px 20px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <v.Icon size={22} color="white" />
          <h2 style={{ fontWeight:900, fontSize:"1.1rem", color:"white", lineHeight:1.2, letterSpacing:"-0.02em" }}>{modal.title}</h2>
        </div>

        {/* Body */}
        <div style={{ padding:"24px" }}>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.6, marginBottom:28 }}>{modal.message}</p>
          <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
            {isConfirm && (
              <button onClick={() => onClose(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.7)", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
                {modal.cancelLabel || "Cancel"}
              </button>
            )}
            <button onClick={() => onClose(true)} style={{ padding:"10px 24px", borderRadius:12, border:"none", background:v.confirmBg, color:v.confirmColor, fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit", minWidth:100, transition:"all 0.2s", boxShadow:`0 0 15px ${v.confirmBg}40` }}>
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