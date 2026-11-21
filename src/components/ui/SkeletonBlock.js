"use client";

export default function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-glass/[0.03] ${className}`} />;
}
