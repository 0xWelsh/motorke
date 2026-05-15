export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  stats = [],
  actions,
  className = "",
}) {
  return (
    <section
      className={`relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/80 to-slate-100/40 px-5 py-6 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 sm:mb-8 sm:px-6 sm:py-7 lg:px-8 ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-emerald-600 shadow-[0_0_12px_rgba(47,133,90,0.65)]"
                aria-hidden
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                {eyebrow}
              </span>
            </div>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>

        {(stats.length > 0 || actions) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
            {stats.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="min-w-[100px] rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 sm:min-w-0"
                  >
                    <p className={`text-lg font-bold tabular-nums sm:text-xl ${s.tone || "text-slate-900 dark:text-white"}`}>
                      {s.value}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        )}
      </div>
    </section>
  );
}
