"use client";

import { useState } from "react";

export default function RunWatchAlertsButton() {
  const [state, setState] = useState("idle");
  const [summary, setSummary] = useState("");

  async function runNow() {
    try {
      setState("running");
      setSummary("");
      const res = await fetch("/api/cron/watch-alerts", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Run failed");
      }
      setState("done");
      setSummary(`Processed ${data.processed} watches, sent ${data.alertsSent} alerts.`);
      setTimeout(() => setState("idle"), 2200);
    } catch (error) {
      setState("error");
      setSummary(error.message || "Failed to run watch alerts.");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={runNow}
        disabled={state === "running"}
        className="px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-black disabled:opacity-60 transition-colors"
      >
        {state === "running" ? "Running..." : "Run Watch Alerts"}
      </button>
      {summary ? (
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {summary}
        </span>
      ) : null}
    </div>
  );
}
