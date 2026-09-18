"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";

export default function CarViewCounter({ initialCount = 0, carId = "" }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    function onRecorded() {
      setCount((c) => c + 1);
    }
    window.addEventListener("car-view-recorded", onRecorded);
    return () => window.removeEventListener("car-view-recorded", onRecorded);
  }, []);

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Eye className="w-3.5 h-3.5 text-slate-400" />
      {count.toLocaleString("en-KE")} views
    </span>
  );
}
