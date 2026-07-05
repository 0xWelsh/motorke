"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Loader2,
  MessageCircle,
  Phone,
  Radar,
  RefreshCw,
  UserPlus,
} from "lucide-react";

const STATUS_STYLES = {
  DISCOVERED: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300",
  CONTACT_COLLECTED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  OUTREACH_PLANNED: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  CONTACTED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  INTERESTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ONBOARDED: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  DECLINED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  DORMANT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
};

function statusClass(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.DISCOVERED;
}

function waHref(phone, name) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(
    `Hi ${name || "there"}, BIDGARI here. We'd love to list your showroom on our verified marketplace.`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

async function apiJson(path, options = {}) {
  const res = await fetch(`/api/admin/growth-agent/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/**
 * @param {{ configured: boolean, prospects: object[] }} props
 */
export default function GrowthAgentPanel({ configured, prospects: initialProspects }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [outreachId, setOutreachId] = useState(null);
  const [outreachChannel, setOutreachChannel] = useState("WHATSAPP");
  const [outreachNote, setOutreachNote] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newProspect, setNewProspect] = useState({
    name: "",
    county: "Nairobi",
    phone: "",
    whatsapp: "",
    email: "",
    source: "manual",
    notes: "",
  });

  async function runAction(key, fn) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      const result = await fn();
      setMessage(typeof result === "string" ? result : "Done.");
      router.refresh();
    } catch (e) {
      setError(e?.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30">
        <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Growth Agent not connected</h2>
        <p className="mt-2 text-sm text-amber-800/90 dark:text-amber-200/80 leading-relaxed max-w-2xl">
          Deploy <code className="text-xs">services/growth-agent</code> and set{" "}
          <code className="text-xs">GROWTH_AGENT_URL</code> +{" "}
          <code className="text-xs">GROWTH_AGENT_SECRET</code> on Vercel. Run{" "}
          <code className="text-xs">npx prisma migrate deploy</code> for growth tables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() =>
            runAction("discover", async () => {
              const data = await apiJson("discover/run", {
                method: "POST",
                body: JSON.stringify({ linkPlatformDealers: true }),
              });
              return `Imported ${data.platformDealersCreated || 0} platform dealers.`;
            })
          }
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {busy === "discover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          Discover dealers
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() =>
            runAction("monitor", async () => {
              const data = await apiJson("monitor/inventory", { method: "POST", body: "{}" });
              return `Checked ${data.checked || 0} prospects, ${data.changed || 0} inventory changes.`;
            })
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          {busy === "monitor" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Monitor stock
        </button>
        <a
          href="/api/admin/growth-agent/export/prospects.csv"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <UserPlus className="h-4 w-4" />
          Add prospect
        </button>
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {addOpen ? (
        <form
          className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            runAction("add", async () => {
              await apiJson("discover/ingest", {
                method: "POST",
                body: JSON.stringify({ prospects: [newProspect] }),
              });
              setAddOpen(false);
              setNewProspect({
                name: "",
                county: "Nairobi",
                phone: "",
                whatsapp: "",
                email: "",
                source: "manual",
                notes: "",
              });
              return "Prospect saved.";
            });
          }}
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">New prospect</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Dealership name"
              value={newProspect.name}
              onChange={(e) => setNewProspect((p) => ({ ...p, name: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              placeholder="County"
              value={newProspect.county}
              onChange={(e) => setNewProspect((p) => ({ ...p, county: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              placeholder="Phone (254…)"
              value={newProspect.phone}
              onChange={(e) => setNewProspect((p) => ({ ...p, phone: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              placeholder="WhatsApp"
              value={newProspect.whatsapp}
              onChange={(e) => setNewProspect((p) => ({ ...p, whatsapp: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              placeholder="Email"
              value={newProspect.email}
              onChange={(e) => setNewProspect((p) => ({ ...p, email: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              placeholder="Source (google_maps, referral…)"
              value={newProspect.source}
              onChange={(e) => setNewProspect((p) => ({ ...p, source: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <textarea
            placeholder="Notes"
            rows={2}
            value={newProspect.notes}
            onChange={(e) => setNewProspect((p) => ({ ...p, notes: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={busy === "add"}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
          >
            Save prospect
          </button>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm min-w-[960px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-3 px-4">Dealership</th>
              <th className="py-3 px-4">County</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Outreach</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialProspects.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No prospects yet. Run Discover dealers or add one manually.
                </td>
              </tr>
            ) : (
              initialProspects.map((row) => {
                const phone = row.phone || row.whatsapp;
                const wa = waHref(phone, row.name);
                const delta =
                  row.inventoryCountPrev != null
                    ? row.inventoryCount - row.inventoryCountPrev
                    : null;
                return (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-zinc-900 align-top">
                    <td className="py-3 px-4 min-w-[160px]">
                      <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{row.source}</p>
                      {row.matchedDealer ? (
                        <Link
                          href={`/dealers/${row.matchedDealer.slug}`}
                          className="text-[11px] text-emerald-600 font-bold hover:underline"
                        >
                          Platform: {row.matchedDealer.name}
                        </Link>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">{row.county}</td>
                    <td className="py-3 px-4 min-w-[120px]">
                      {phone ? (
                        <a
                          href={wa || `tel:${phone}`}
                          target={wa ? "_blank" : undefined}
                          rel={wa ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                        >
                          {wa ? <MessageCircle className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                          {phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">No phone</span>
                      )}
                      {row.email ? (
                        <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[140px]">{row.email}</p>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={row.status}
                        disabled={!!busy}
                        onChange={(e) =>
                          runAction(`status-${row.id}`, async () => {
                            await apiJson(`prospects/${row.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ status: e.target.value }),
                            });
                            return "Status updated.";
                          })
                        }
                        className={`text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 border-0 ${statusClass(row.status)}`}
                      >
                        {Object.keys(STATUS_STYLES).map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      <span className="font-bold">{row.inventoryCount}</span>
                      {delta != null && delta !== 0 ? (
                        <span
                          className={`ml-1 text-[11px] font-bold ${delta > 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">{row.outreachCount} touches</p>
                      {row.lastOutreachAt ? (
                        <p>{new Date(row.lastOutreachAt).toLocaleDateString("en-KE")}</p>
                      ) : (
                        <p>Never</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {outreachId === row.id ? (
                        <div className="flex flex-col gap-2 items-end max-w-[220px] ml-auto">
                          <select
                            value={outreachChannel}
                            onChange={(e) => setOutreachChannel(e.target.value)}
                            className="w-full rounded border border-slate-200 text-xs px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            <option value="WHATSAPP">WhatsApp</option>
                            <option value="CALL">Call</option>
                            <option value="EMAIL">Email</option>
                            <option value="VISIT">Visit</option>
                          </select>
                          <input
                            value={outreachNote}
                            onChange={(e) => setOutreachNote(e.target.value)}
                            placeholder="Note"
                            className="w-full rounded border border-slate-200 text-xs px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-[10px] font-bold uppercase text-slate-500"
                              onClick={() => setOutreachId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!!busy}
                              onClick={() =>
                                runAction(`outreach-${row.id}`, async () => {
                                  await apiJson(`prospects/${row.id}/outreach`, {
                                    method: "POST",
                                    body: JSON.stringify({
                                      channel: outreachChannel,
                                      status: "SENT",
                                      body: outreachNote || "Outreach logged from admin",
                                    }),
                                  });
                                  setOutreachId(null);
                                  setOutreachNote("");
                                  return "Outreach logged.";
                                })
                              }
                              className="text-[10px] font-bold uppercase text-emerald-600"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOutreachId(row.id);
                            setOutreachNote("");
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 dark:text-zinc-400"
                        >
                          Log outreach
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
