"use client";
import Link from "next/link";
import { 
  AlertCircle, 
  ChevronRight, 
  Clock, 
  UserPlus, 
  Car, 
  MessageSquare,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

/**
 * A clean, non-blocky action feed for the admin dashboard.
 * Focuses on typography and subtle depth rather than rigid containers.
 */
export default function AdminActionFeed({ actions = [] }) {
  if (!actions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">All clear!</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">No urgent items require your attention right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {actions.map((action, idx) => (
        <ActionItem key={action.id || idx} action={action} />
      ))}
    </div>
  );
}

function ActionItem({ action }) {
  const { title, subtitle, href, type, timeAgo, priority } = action;

  // Icon mapping based on action type
  const icons = {
    approval: <UserPlus className="text-amber-500" size={18} />,
    stale: <Clock className="text-rose-500" size={18} />,
    listing: <Car className="text-blue-500" size={18} />,
    lead: <MessageSquare className="text-emerald-500" size={18} />,
    system: <AlertCircle className="text-slate-400" size={18} />,
  };

  const priorityColors = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-slate-300",
  };

  return (
    <Link
      href={href}
      className="group relative flex items-start gap-4 rounded-xl p-3 transition-all hover:bg-slate-50 dark:hover:bg-zinc-900/50"
    >
      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 group-hover:ring-slate-300 dark:bg-zinc-900 dark:ring-zinc-800 dark:group-hover:ring-zinc-700">
        {icons[type] || icons.system}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {priority && (
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityColors[priority]}`} title={`${priority} priority`} />
          )}
          <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {title}
          </h4>
        </div>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-zinc-400 line-clamp-1">
          {subtitle}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo}
          </span>
          <span className="flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
            View Details
            <ArrowUpRight size={10} />
          </span>
        </div>
      </div>

      <ChevronRight className="mt-3 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-zinc-700" size={16} />
    </Link>
  );
}
