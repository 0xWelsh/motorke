"use client";
import Link from "next/link";
import { Clock, ShieldAlert } from "lucide-react";

export default function AdminActionFeed({ actions = [] }) {
  if (!actions.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950/30 text-emerald-400">
          <ShieldAlert size={16} />
        </div>
        <p className="text-sm font-medium text-white">All clear</p>
        <p className="text-xs text-zinc-500 mt-0.5">No urgent items</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
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
      className="group flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {priority && (
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              priority === "high" ? "bg-rose-500" : priority === "medium" ? "bg-amber-500" : "bg-zinc-600"
            }`} />
          )}
          <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
            {title}
          </h4>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{subtitle}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold text-zinc-600">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo}
          </span>
        </div>
      </div>
    </Link>
  );
}
