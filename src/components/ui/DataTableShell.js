export default function DataTableShell({ children, className = "", stickyHeader = true }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset] ${className}`}>
      <div className="overflow-x-auto">
        <div className={stickyHeader ? "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10" : ""}>{children}</div>
      </div>
    </div>
  );
}
