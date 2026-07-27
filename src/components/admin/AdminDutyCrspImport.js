"use client";

import { useState } from "react";
import { Upload, Download, FileSpreadsheet } from "lucide-react";

export default function AdminDutyCrspImport({ initialCount = 0 }) {
  const [file, setFile] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runImport = async () => {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/duty-vehicles/import?dryRun=${dryRun ? "1" : "0"}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (e) {
      setError(e.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
        <p className="text-sm font-semibold text-white">Catalog size</p>
        <p className="text-2xl font-bold tabular-nums text-[var(--accent)] mt-1">
          {result?.activeCatalogCount ?? initialCount}
        </p>
        <p className="text-xs text-zinc-400 mt-1">Active duty vehicles in database</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/duty-vehicles/template"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.03]"
        >
          <Download className="w-4 h-4" aria-hidden />
          Download CSV template
        </a>
        <a
          href="/duty"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.03]"
        >
          Open duty calculator
        </a>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-6">
        <div className="flex items-start gap-3 mb-5">
          <FileSpreadsheet className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden />
          <div>
            <h2 className="text-sm font-bold text-white">Upload CRSP catalog CSV</h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
              No KRA Excel required. Edit{" "}
              <code className="text-[11px] bg-white/[0.03] px-1 rounded">
                data/duty-crsp/starter-catalog.csv
              </code>{" "}
              in Google Sheets, export as CSV, and upload here. Rows upsert by slug (safe to re-import).
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
              setError("");
            }}
            className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-white"
          />
        </label>

        <label className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="rounded border-white/[0.06]"
          />
          Dry run (validate only, do not write to database)
        </label>

        <button
          type="button"
          onClick={runImport}
          disabled={loading || !file}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent)]/80 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" aria-hidden />
          {loading ? "Importing…" : dryRun ? "Validate CSV" : "Import to database"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-5 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4 text-sm">
            <p className="font-bold text-emerald-200">
              {result.dryRun ? "Validation complete" : "Import complete"}
            </p>
            <ul className="mt-2 space-y-1 text-emerald-300 text-xs">
              <li>Parsed: {result.parsed} rows</li>
              <li>
                {result.dryRun ? "Would upsert" : "Upserted"}: {result.upserted}
              </li>
              <li>Skipped: {result.skipped}</li>
              <li>Active catalog: {result.activeCatalogCount}</li>
            </ul>
            {((result.parseErrors?.length ?? 0) > 0 || (result.rowErrors?.length ?? 0) > 0) && (
              <div className="mt-3 text-xs text-amber-200">
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {(result.parseErrors || []).map((e) => (
                    <li key={`p-${e.line}-${e.message}`}>
                      Line {e.line}: {e.message}
                    </li>
                  ))}
                  {(result.rowErrors || []).map((e) => (
                    <li key={`r-${e.line}-${e.message}`}>
                      Line {e.line}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
