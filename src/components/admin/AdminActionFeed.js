"use client";
import Link from "next/link";
import { Clock, ShieldCheck } from "lucide-react";

export default function AdminActionFeed({ actions = [] }) {
  if (!actions.length) {
    return (
      <div className="flex flex-col items-center px-5 py-10 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ShieldCheck size={18} />
        </div>
        <p className="text-sm font-bold text-text">All clear</p>
        <p className="mt-0.5 text-xs text-dim">No urgent items</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {actions.map((a, i) => (
        <ActionItem key={a.id || i} action={a} />
      ))}
    </div>
  );
}

function ActionItem({ action }) {
  const { title, subtitle, href, priority, timeAgo } = action;

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-overlay"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {priority && (
            <span className={`h-2 w-2 shrink-0 rounded-full ${
              priority === "high" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : priority === "medium" ? "bg-amber-500" : "bg-slate-500"
            }`} />
          )}
          <h4 className="truncate text-sm font-bold text-text transition-colors group-hover:text-emerald-600">
            {title}
          </h4>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{subtitle}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[10px] font-semibold text-muted">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo}
          </span>
        </div>
      </div>
    </Link>
  );
}
