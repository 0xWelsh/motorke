"use client";
import { useState } from "react";
import { Shield } from "lucide-react";
import { useAdminMode } from "@/hooks/use-admin-mode";

const HIDE_KEY = "wmh-admin-pill-hidden";

// Small floating "Admin mode" indicator on public pages so you remember the
// shield overlays are live. Click to dismiss for this browser.
export default function AdminModePill() {
  const isAdmin = useAdminMode();
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(HIDE_KEY) === "1"; } catch { return false; }
  });

  if (!isAdmin || hidden) return null;

  return (
    <button
      type="button"
      onClick={() => {
        try { localStorage.setItem(HIDE_KEY, "1"); } catch { /* ignore */ }
        setHidden(true);
      }}
      title="Admin mode active — click to hide this hint"
      className="fixed bottom-3 left-3 z-[90] inline-flex items-center gap-1.5 rounded-full bg-zinc-900/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-300 shadow-lg backdrop-blur"
    >
      <Shield size={11} /> Admin mode
    </button>
  );
}