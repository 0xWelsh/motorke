export default function DataTableShell({ children, className = "", stickyHeader = true }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[#ede7dd] bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111111] ${className}`}>
      <div className="overflow-x-auto">
        <div className={stickyHeader ? "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10" : ""}>{children}</div>
      </div>
    </div>
  );
}
