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
      className="btn btn-neutral btn-sm no-print"
    >
      <Printer size={14} />
      <span>Print Spec Sheet</span>
    </button>
  );
}
