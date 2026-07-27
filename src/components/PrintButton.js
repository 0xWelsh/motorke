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
      className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-white/70 hover:text-white rounded-2xl transition-all text-xs font-bold uppercase tracking-widest no-print"
    >
      <Printer size={14} />
      <span>Print Spec Sheet</span>
    </button>
  );
}
