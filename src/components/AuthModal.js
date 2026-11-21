"use client";

import { Suspense, useEffect, useState } from "react";
import { X } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";

/**
 * Overlay sign-in / sign-up sheet. Renders the exact same forms as the
 * /login and /signup pages, so behavior (Google button, errors, redirects)
 * is identical — only the container changes.
 */
export default function AuthModal({ state, onClose }) {
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (state) setMode(state.mode);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [state, onClose]);

  if (!state) return null;
  const isSignup = mode === "signup";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh] backdrop-blur-sm sm:pt-[10vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isSignup ? "Create an account" : "Sign in"}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl animate-slide-up">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-dim transition-colors hover:bg-surface-overlay hover:text-text"
        >
          <X size={18} />
        </button>

        <div className="flex border-b border-border px-6 pt-5">
          {[
            { mode: "login", label: "Sign In" },
            { mode: "signup", label: "Register" },
          ].map((tab) => (
            <button
              key={tab.mode}
              type="button"
              onClick={() => setMode(tab.mode)}
              className={`-mb-px border-b-2 px-3 pb-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors ${
                (tab.mode === "signup") === isSignup
                  ? "border-[var(--accent)] text-text"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-surface-overlay" />}>
            {isSignup ? <SignupForm /> : <LoginForm />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
