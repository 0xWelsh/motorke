"use client";
// src/components/BulkUpload.js

import { useState, useRef } from "react";
import { MIN_BULK_UPLOAD_CARS } from "@/lib/bulk-upload-policy";

const REQUIRED = ["make", "model", "year", "price", "fuelType", "transmission", "bodyType"];
const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"];
const TRANSMISSIONS = ["AUTOMATIC", "MANUAL", "CVT"];
const BODY_TYPES = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "VAN", "WAGON", "COUPE", "CONVERTIBLE", "CROSSOVER", "MPV", "MINIVAN", "ROADSTER", "LIFTBACK", "BUS", "TRUCK"];

function parseCSV(text) {
  const lines  = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    // Handle quoted commas
    const values = [];
    let inQuote = false, cur = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
  });
}

function validateRow(row, i) {
  const errors = [];
  for (const field of REQUIRED) {
    if (!row[field]) errors.push(`Row ${i + 2}: missing "${field}"`);
  }
  if (row.year && (isNaN(row.year) || row.year < 1980 || row.year > new Date().getFullYear() + 1)) {
    errors.push(`Row ${i + 2}: invalid year "${row.year}"`);
  }
  if (row.price && isNaN(row.price)) errors.push(`Row ${i + 2}: price must be a number`);
  if (row.fueltype && !FUEL_TYPES.includes(row.fueltype?.toUpperCase())) {
    errors.push(`Row ${i + 2}: fuelType must be one of ${FUEL_TYPES.join(", ")}`);
  }
  if (row.transmission && !TRANSMISSIONS.includes(row.transmission?.toUpperCase())) {
    errors.push(`Row ${i + 2}: transmission must be one of ${TRANSMISSIONS.join(", ")}`);
  }
  return errors;
}

export default function BulkUpload({ dealers, mode = "ADMIN" }) {
  const [rows,      setRows]      = useState([]);
  const [errors,    setErrors]    = useState([]);
  const [dealerId,  setDealerId]  = useState(dealers[0]?.id || "");
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef(null);
  const submitEndpoint = "/api/cars/bulk";

  function processFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text   = e.target.result;
      const parsed = parseCSV(text);
      const errs = parsed.flatMap((row, i) => validateRow(row, i));
      if (parsed.length > 0 && parsed.length < MIN_BULK_UPLOAD_CARS) {
        errs.push(
          `Bulk import must include at least ${MIN_BULK_UPLOAD_CARS} cars (this file has ${parsed.length}). Add more rows, or list one or two cars manually.`
        );
      }
      setRows(parsed);
      setErrors(errs);
      setResult(null);
    };
    reader.readAsText(file);
  }

  function handleFile(e) { processFile(e.target.files[0]); }
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }

  async function handleSubmit() {
    if (!dealerId) { alert("Select a dealership first"); return; }
    if (errors.length > 0) { alert("Fix validation errors before uploading"); return; }
    setUploading(true);
    try {
      const res  = await fetch(submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId, rows }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) { setRows([]); setErrors([]); }
    } catch (err) {
      setResult({ error: err.message });
    }
    setUploading(false);
  }

  const s = {
    select: { background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", color: "#1A1A1A", width: "100%" },
  };

  return (
    <div>
      {/* Dealer selector */}
        <div style={{ background: "#fff", border: "1px solid #E2E2E2", borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>
            Assign all cars to dealership *
          </label>
          <select value={dealerId} onChange={e => setDealerId(e.target.value)} style={{ ...s.select, maxWidth: 400 }}>
            {dealers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.location}</option>)}
          </select>
        </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "#E8490F" : "#E2E2E2"}`,
          borderRadius: 14, padding: "40px 24px", textAlign: "center",
          cursor: "pointer", transition: "all 0.2s", marginBottom: 16,
          background: dragOver ? "#fff0eb" : "#fff",
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: "none" }} />
        <p style={{ fontSize: 36, marginBottom: 12 }}>📂</p>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#0A2640", marginBottom: 6 }}>
          {rows.length > 0 ? `${rows.length} rows loaded` : "Drop your CSV file here"}
        </p>
        <p style={{ fontSize: 13, color: "#999" }}>or click to browse · CSV files only</p>
        <p style={{ fontSize: 12, color: "#777", marginTop: 10, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          Each bulk file must include at least {MIN_BULK_UPLOAD_CARS} cars. For fewer, use the single-car form.
        </p>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={{ background: "#fff0eb", border: "1.5px solid #fbc8b5", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: "#c73d0c", marginBottom: 8 }}>⚠️ {errors.length} validation error{errors.length > 1 ? "s" : ""}</p>
          {errors.slice(0, 5).map((e, i) => <p key={i} style={{ fontSize: 12, color: "#c73d0c", marginTop: 4 }}>• {e}</p>)}
          {errors.length > 5 && <p style={{ fontSize: 12, color: "#c73d0c", marginTop: 4 }}>...and {errors.length - 5} more</p>}
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && errors.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #E2E2E2", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E2E2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#0A2640" }}>Preview — {rows.length} cars ready to import</p>
            <span style={{ fontSize: 12, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 99, padding: "3px 12px", fontWeight: 600 }}>✓ No errors</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F5F5F5" }}>
                  {["Year", "Make", "Model", "Variant", "Price (KES)", "Fuel", "Transmission", "Body"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td style={{ padding: "10px 14px", color: "#333" }}>{row.year}</td>
                    <td style={{ padding: "10px 14px", color: "#333", fontWeight: 600 }}>{row.make}</td>
                    <td style={{ padding: "10px 14px", color: "#333" }}>{row.model}</td>
                    <td style={{ padding: "10px 14px", color: "#999" }}>{row.variant || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#E8490F", fontWeight: 700 }}>
                      {row.price ? formatCarPrice(row) : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#333" }}>{row.fueltype || row.fuelType}</td>
                    <td style={{ padding: "10px 14px", color: "#333" }}>{row.transmission}</td>
                    <td style={{ padding: "10px 14px", color: "#333" }}>{row.bodytype || row.bodyType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <p style={{ padding: "10px 14px", fontSize: 12, color: "#999", borderTop: "1px solid #F5F5F5" }}>
                ...and {rows.length - 10} more rows
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ borderRadius: 12, padding: "14px 20px", marginBottom: 16, background: result.success ? "#f0fdf4" : "#fff0eb", border: `1.5px solid ${result.success ? "#bbf7d0" : "#fbc8b5"}` }}>
          {result.success
            ? <p style={{ fontWeight: 700, color: "#16a34a" }}>✓ Successfully imported {result.count} cars!</p>
            : <p style={{ fontWeight: 700, color: "#c73d0c" }}>⚠️ Error: {result.error}</p>
          }
        </div>
      )}

      {/* Submit */}
      {rows.length > 0 && errors.length === 0 && (
        <button
          onClick={handleSubmit}
          disabled={uploading}
          style={{ background: uploading ? "#ccc" : "#E8490F", color: "white", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit", width: "100%" }}
        >
          {uploading ? `Importing ${rows.length} cars…` : `Import ${rows.length} cars now →`}
        </button>
      )}
    </div>
  );
}