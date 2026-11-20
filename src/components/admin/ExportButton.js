"use client";
import { Download } from "lucide-react";
import { clsx } from "clsx";

export default function ExportButton({
  data,
  filename = "export.csv",
  label = "Export",
  className,
}) {
  const empty = !data || data.length === 0;

  const exportToCSV = () => {
    if (empty || !data[0]) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((obj) => Object.values(obj).map((val) => `"${val}"`).join(",")).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      type="button"
      disabled={empty}
      onClick={exportToCSV}
      title={empty ? "No rows to export" : `Download ${filename}`}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-slate-900 shadow-sm transition hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F855A]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e]",
        empty && "cursor-not-allowed opacity-45 hover:bg-slate-50 hover:border-slate-300",
        className,
      )}
    >
      <Download size={17} strokeWidth={2} aria-hidden /> {label}
    </button>
  );
}
