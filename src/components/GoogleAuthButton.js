"use client";
// src/components/GoogleAuthButton.js
// Clean, brand-aligned Google sign-in / sign-up button.
// Uses the server redirect flow (/api/auth/google/start) so the styling
// is fully ours — no embedded Google iframe and no GIS button skin.

import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { clsx } from "clsx";

/**
 * @param {object} props
 * @param {"signin" | "signup"} [props.mode="signin"]
 * @param {string}              [props.next="/"]   Path to land on after auth.
 * @param {boolean}             [props.fullWidth=true]
 * @param {string}              [props.className]
 * @param {string}              [props.label]      Override the visible label.
 */
export default function GoogleAuthButton({
  mode = "signin",
  next = "/",
  fullWidth = true,
  className = "",
  label,
}) {
  // Render nothing when OAuth isn't configured for this environment
  // (e.g. ephemeral preview deploys without the client id).
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  const text =
    label ||
    (mode === "signup" ? "Sign up with Google" : "Continue with Google");

  const safeNext = next && next.startsWith("/") ? next : "/";
  const href = `/api/auth/google/start?mode=${mode}&next=${encodeURIComponent(safeNext)}`;

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={text}
      className={clsx(
        // Layout
        "group relative inline-flex items-center justify-center gap-3",
        "h-12 px-5",
        fullWidth ? "w-full" : "",
        // Colors
        "bg-white dark:bg-[#111] text-slate-900 dark:text-white",
        "border border-slate-200 dark:border-zinc-800",
        // Typography (match form aesthetic)
        "text-[12px] sm:text-[13px] font-bold tracking-[0.01em]",
        // Interactions
        "transition-[border-color,box-shadow,background-color,transform] duration-150",
        "hover:border-slate-300 dark:hover:border-zinc-700",
        "hover:shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 focus-visible:border-[#1a73e8]",
        "active:scale-[0.99]",
        className
      )}
      style={{ borderRadius: "2px" }}
    >
      <FcGoogle className="h-5 w-5 shrink-0" aria-hidden />
      <span className="truncate">{text}</span>
    </Link>
  );
}

/**
 * A horizontal "or continue with email" divider, designed to sit between
 * the Google button and the password form.
 */
export function GoogleAuthDivider({
  label = "Or continue with email",
  className = "",
}) {
  return (
    <div className={clsx("relative my-5", className)} role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-100 dark:border-zinc-900" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white dark:bg-[#0a0a0a] px-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}
