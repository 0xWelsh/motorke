export default function DataTableShell({ children, className = "", stickyHeader = true }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1c1c1c] shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <div className={stickyHeader ? "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10" : ""}>{children}</div>
      </div>
    </div>
  );
}
