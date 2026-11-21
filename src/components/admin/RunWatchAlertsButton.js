"use client";

import { useState } from "react";
import { humanizeError, humanizeApiError } from "@/lib/humanize-error";

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
        throw new Error(humanizeApiError(data, "Run failed"));
      }
      setState("done");
      setSummary(`Processed ${data.processed} watches, sent ${data.alertsSent} alerts.`);
      setTimeout(() => setState("idle"), 2200);
    } catch (error) {
      setState("error");
      setSummary(humanizeError(error, "Failed to run watch alerts."));
      setTimeout(() => setState("idle"), 3000);
    }
  }

  async function sendTestEmail() {
    try {
      setState("running");
      setSummary("");
      const res = await fetch("/api/cron/watch-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(humanizeApiError(data, "Test send failed"));
      }
      setState("done");
      if (data.mocked) {
        setSummary(data.message || "SMTP not set — check server logs for mock output.");
      } else {
        setSummary(`Test alert sent to ${data.to} (from ${data.from || "configured MAIL_FROM_*"}).`);
      }
      setTimeout(() => setState("idle"), 5000);
    } catch (error) {
      setState("error");
      setSummary(humanizeError(error, "Failed to send test email."));
      setTimeout(() => setState("idle"), 5000);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={runNow}
          disabled={state === "running"}
          className="px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest bg-accent text-text hover:bg-accent disabled:opacity-60 transition-colors"
        >
          {state === "running" ? "Running..." : "Run Watch Alerts"}
        </button>
        <button
          type="button"
          onClick={sendTestEmail}
          disabled={state === "running"}
          className="px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest border border-[#2F855A] text-accent hover:bg-accent/10 border-emerald-400/80 text-emerald-700 hover:bg-emerald-950/50 disabled:opacity-60 transition-colors"
        >
          Send Test Alert Email
        </button>
      </div>
      {summary ? (
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted max-w-md">
          {summary}
        </span>
      ) : null}
    </div>
  );
}
