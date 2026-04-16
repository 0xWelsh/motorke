"use client";
import { Printer } from "lucide-react";

export default function PrintButton({ carId }) {
  const handlePrint = () => {
    window.print();
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "print" }),
      headers: { "Content-Type": "application/json" }
    }).catch(console.error);
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2 bg-[#fbfcfe] border border-[#ddd4c8] hover:bg-white text-slate-900/70 hover:text-slate-900 rounded-none transition-all text-xs font-bold uppercase tracking-widest no-print"
    >
      <Printer size={14} />
      <span>Print Spec Sheet</span>
    </button>
  );
}
