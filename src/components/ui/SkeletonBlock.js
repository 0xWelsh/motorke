"use client";

export default function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.03] ${className}`} />;
}
