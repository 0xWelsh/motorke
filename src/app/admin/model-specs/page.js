"use client";
import { useCallback, useEffect, useState } from "react";
import { Database, Plus, Search, Pencil, Trash2, X, Check, Loader2, Globe, GlobeOff } from "lucide-react";
import {
  BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, DRIVETRAIN_LABELS,
  STEERING_LABELS, VEHICLE_TYPE_LABELS,
} from "@/lib/utils";

const EMPTY_FORM = {
  make: "", model: "", variant: "", yearStart: "", yearEnd: "",
  bodyType: "", vehicleType: "CAR", engineCC: "", cylinders: "", horsepower: "",
  torque: "", fuelType: "", transmission: "", drivetrain: "", steering: "RHD",
  seats: "", doors: "", airbags: "", groundClearanceMm: "",
  turbo: false, sunroof: false,
  curbWeightKg: "", fuelTankLiters: "", standardFeatures: "", source: "admin", verified: false, published: false, imageUrl: "",
};

export default function ModelSpecsAdmin() {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("make", search);
      const res = await fetch(`/api/admin/model-specs?${params}`);
      const data = await res.json();
      if (data.ok) setSpecs(data.specs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (spec) => {
    setEditingId(spec.id);
    setForm({
      make: spec.make || "",
      model: spec.model || "",
      variant: spec.variant || "",
      yearStart: String(spec.yearStart || ""),
      yearEnd: spec.yearEnd ? String(spec.yearEnd) : "",
      bodyType: spec.bodyType || "",
      vehicleType: spec.vehicleType || "CAR",
      engineCC: spec.engineCC ? String(spec.engineCC) : "",
      cylinders: spec.cylinders ? String(spec.cylinders) : "",
      horsepower: spec.horsepower ? String(spec.horsepower) : "",
      torque: spec.torque ? String(spec.torque) : "",
      fuelType: spec.fuelType || "",
      transmission: spec.transmission || "",
      drivetrain: spec.drivetrain || "",
      steering: spec.steering || "RHD",
      seats: spec.seats ? String(spec.seats) : "",
      doors: spec.doors ? String(spec.doors) : "",
      airbags: spec.airbags ? String(spec.airbags) : "",
      groundClearanceMm: spec.groundClearanceMm ? String(spec.groundClearanceMm) : "",
      turbo: spec.turbo || false,
      sunroof: spec.sunroof || false,
      curbWeightKg: spec.curbWeightKg ? String(spec.curbWeightKg) : "",
      fuelTankLiters: spec.fuelTankLiters ? String(spec.fuelTankLiters) : "",
      standardFeatures: (spec.standardFeatures || []).join(", "),
      source: spec.source || "admin",
      verified: spec.verified || false,
      published: spec.published || false,
      imageUrl: spec.imageUrl || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form };
      const url = `/api/admin/model-specs`;
      const method = editingId ? "PUT" : "POST";
      if (editingId) payload.id = editingId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: editingId ? "Updated." : "Created." });
        resetForm();
        load();
      } else {
        setMessage({ type: "error", text: data.error || "Failed." });
      }
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (spec) => {
    const payload = { id: spec.id, published: !spec.published };
    try {
      const res = await fetch(`/api/admin/model-specs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: spec.published ? "Unpublished." : "Published." });
        load();
      }
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this spec?")) return;
    try {
      const res = await fetch(`/api/admin/model-specs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) { setMessage({ type: "success", text: "Deleted." }); load(); }
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const SelectField = ({ field, label, options, empty = "—" }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <select value={form[field]} onChange={(e) => update(field, e.target.value)}
        className="w-full border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900">
        <option value="">{empty}</option>
        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );

  const InputField = ({ field, label, type = "text", placeholder = "" }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <input type={type} value={form[field]} onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900"
      />
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reference Library</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Model Specs</h1>
          <p className="text-sm text-slate-500 mt-1">{specs.length} specs in database</p>
        </div>
        <button onClick={resetForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-700 transition-all">
          <Plus size={14} /> Add Spec
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl mb-6 font-semibold text-sm flex items-center gap-2 ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80"
            : "bg-red-50 text-red-600 border border-red-100"
        }`}>
          {message.type === "success" ? <Check size={16} /> : <X size={16} />}
          {message.text}
        </div>
      )}

      {/* Edit/Create Form */}
      {(editingId || form.make) && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? "Edit Spec" : "New Spec"}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500">
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <InputField field="make" label="Make" placeholder="Toyota" />
            <InputField field="model" label="Model" placeholder="Harrier" />
            <InputField field="variant" label="Variant" placeholder="Premium" />
            <InputField field="yearStart" label="Year start" type="number" />
            <InputField field="yearEnd" label="Year end" type="number" placeholder="null = current" />
            <SelectField field="bodyType" label="Body" options={BODY_TYPE_LABELS} />
            <SelectField field="vehicleType" label="Type" options={VEHICLE_TYPE_LABELS} />
            <InputField field="engineCC" label="Engine CC" type="number" />
            <InputField field="cylinders" label="Cylinders" type="number" />
            <InputField field="horsepower" label="Horsepower" type="number" />
            <InputField field="torque" label="Torque Nm" type="number" />
            <SelectField field="fuelType" label="Fuel" options={FUEL_LABELS} />
            <SelectField field="transmission" label="Transmission" options={TRANSMISSION_LABELS} />
            <SelectField field="drivetrain" label="Drivetrain" options={DRIVETRAIN_LABELS} />
            <SelectField field="steering" label="Steering" options={STEERING_LABELS} />
            <InputField field="seats" label="Seats" type="number" />
            <InputField field="doors" label="Doors" type="number" />
            <InputField field="airbags" label="Airbags" type="number" />
            <InputField field="groundClearanceMm" label="Clearance mm" type="number" />
            <InputField field="curbWeightKg" label="Curb weight kg" type="number" />
            <InputField field="fuelTankLiters" label="Tank liters" type="number" />
            <InputField field="imageUrl" label="Image URL" placeholder="https://upload.wikimedia.org/..." />
          </div>

          <div className="flex items-center gap-6 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.turbo} onChange={(e) => update("turbo", e.target.checked)}
                className="w-4 h-4 accent-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Turbo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.sunroof} onChange={(e) => update("sunroof", e.target.checked)}
                className="w-4 h-4 accent-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Sunroof</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.verified} onChange={(e) => update("verified", e.target.checked)}
                className="w-4 h-4 accent-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Verified</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)}
                className="w-4 h-4 accent-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Published</span>
            </label>
          </div>

          <div className="space-y-1 mb-6">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard Features</label>
            <textarea value={form.standardFeatures} onChange={(e) => update("standardFeatures", e.target.value)}
              rows={3} placeholder="Leather seats, Sunroof, Reverse camera… (comma-separated)"
              className="w-full border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 resize-y"
            />
          </div>

          <button onClick={handleSave} disabled={!form.make || !form.model || !form.yearStart || saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-all">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingId ? "Update" : "Create"}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by make…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      ) : specs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No specs found. Add one above.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-700">
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Make</th>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Model</th>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Variant</th>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Years</th>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Engine</th>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">HP</th>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Body</th>
                <th className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Fuel</th>
                <th className="text-center py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Published</th>
                <th className="text-center py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Verified</th>
                <th className="text-right py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr key={spec.id} className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{spec.make}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{spec.model}</td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{spec.variant || "—"}</td>
                  <td className="py-3 px-3 text-xs text-slate-500">{spec.yearStart}{spec.yearEnd ? `–${spec.yearEnd}` : "+"}</td>
                  <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">{spec.engineCC ? `${(spec.engineCC / 1000).toFixed(1)}L` : "—"}</td>
                  <td className="py-3 px-3 text-xs text-slate-600">{spec.horsepower || "—"}</td>
                  <td className="py-3 px-3 text-xs text-slate-500">{spec.bodyType || "—"}</td>
                  <td className="py-3 px-3 text-xs text-slate-500">{spec.fuelType || "—"}</td>
                  <td className="py-3 px-3 text-center">
                    <button onClick={() => togglePublished(spec)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        spec.published
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-500"
                      }`}
                    >
                      {spec.published ? <Globe size={12} /> : <GlobeOff size={12} />}
                      {spec.published ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {spec.verified
                      ? <span className="text-emerald-600 font-bold text-xs">Yes</span>
                      : <span className="text-slate-400 text-xs">No</span>}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(spec)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg dark:hover:bg-zinc-700 transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(spec.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-950/30 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
