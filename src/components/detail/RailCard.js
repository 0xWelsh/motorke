// src/components/detail/RailCard.js
// Shared chrome for a titled card in the listing contact rail.
// Deliberately a plain server component — no state, no hooks.
export default function RailCard({ title, action = null, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
