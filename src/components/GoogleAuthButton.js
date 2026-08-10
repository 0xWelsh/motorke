"use client";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { clsx } from "clsx";

export default function GoogleAuthButton({
  mode = "signin",
  next = "/",
  fullWidth = true,
  className = "",
  label,
}) {
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
        "btn btn-neutral",
        fullWidth ? "w-full" : "",
        className
      )}
    >
      <FcGoogle className="h-4.5 w-4.5 shrink-0" aria-hidden />
      <span className="truncate">{text}</span>
    </Link>
  );
}

export function GoogleAuthDivider({
  label = "Or continue with email",
  className = "",
}) {
  return (
    <div className={clsx("relative my-4", className)} role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[var(--bg)] px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
      </div>
    </div>
  );
}
