/** Simple server-rendered bar chart for GSC daily clicks. */
export default function AdminGscTrendChart({ series = [] }) {
  if (!series.length) {
    return <p className="text-sm text-muted px-4 py-3">No daily trend data yet — run GSC_DAILY job.</p>;
  }

  const maxClicks = Math.max(...series.map((d) => d.clicks), 1);

  return (
    <div className="px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
        Clicks per day (28d)
      </p>
      <div className="flex items-end gap-1 h-28 border-b border-border pb-1">
        {series.map((d) => {
          const h = Math.max(4, Math.round((d.clicks / maxClicks) * 100));
          const label = new Date(d.date).toISOString().slice(5, 10);
          return (
            <div
              key={d.id || label}
              className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 group"
              title={`${label}: ${d.clicks} clicks, ${d.impressions} imp, pos ${Number(d.position).toFixed(1)}`}
            >
              <div
                className="w-full max-w-[14px] bg-accent rounded-t transition-opacity group-hover:opacity-80"
                style={{ height: `${h}%` }}
              />
              <span className="text-[8px] text-dim tabular-nums truncate w-full text-center">
                {label.slice(3)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted mt-2 tabular-nums">
        Total: {series.reduce((s, d) => s + d.clicks, 0).toLocaleString()} clicks ·{" "}
        {series.reduce((s, d) => s + d.impressions, 0).toLocaleString()} impressions
      </p>
    </div>
  );
}
