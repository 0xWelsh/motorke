import Link from "next/link";

export default function EmptyState({ title, message, actionHref, actionLabel, secondaryHref, secondaryLabel, icon }) {
  return (
    <div className="flex flex-col items-center border-t border-dashed border-[#ede7dd] px-6 py-16 text-center dark:border-zinc-800">
      {icon ? <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#f6f7f9] dark:bg-zinc-800">{icon}</div> : null}
      <p className="text-lg font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-zinc-400">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex items-center rounded-xl border border-[#ddd4c8] bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-800 hover:bg-[#f6f7f9] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            {secondaryLabel}
          </Link>
        ) : null}
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2F855A] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] text-white hover:bg-[#38A169]"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
