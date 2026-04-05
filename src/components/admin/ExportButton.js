"use client";
import { Download } from "lucide-react";

export default function ExportButton({ data, filename = "export.csv" }) {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => 
      Object.values(obj).map(val => `"${val}"`).join(",")
    ).join("\n");

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
      onClick={exportToCSV}
      className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
    >
      <Download size={16} /> Export Registry
    </button>
  );
}
