"use client";

export default function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-zinc-800 ${className}`} />;
}
