import Link from "next/link";

export default function EmptyState({ title, message, actionHref, actionLabel, secondaryHref, secondaryLabel, icon }) {
  return (
    <div className="flex flex-col items-center border-t border-dashed border-white/[0.06] px-6 py-16 text-center">
      {icon ? <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white/[0.03]">{icon}</div> : null}
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex items-center rounded-xl border border-white/[0.06] bg-[#1c1c1c] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] text-white hover:bg-white/[0.03]"
          >
            {secondaryLabel}
          </Link>
        ) : null}
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="btn btn-primary btn-sm"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
